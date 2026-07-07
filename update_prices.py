"""
update_prices.py — weekly price updater for the Boodschappenplanner.

Prices come from the checkjebon.nl open dataset (MIT-licensed):
https://github.com/supermarkt/checkjebon — the repo's README explicitly
allows reuse of data/supermarkets.json in other projects. It is refreshed
by their pipeline roughly daily; we pull it weekly.

Coverage notes:
- AH: full coverage.
- Lidl: included via boodschaapje.nl; a few fresh items (e.g. loose
  bananas) are missing and fall back to the previous/sample price.

Run on a schedule (cron / systemd timer / GitHub Action):
    pip install httpx
    python update_prices.py
"""

from __future__ import annotations
import json
import re
import unicodedata
import datetime
import urllib.request
from abc import ABC, abstractmethod
from pathlib import Path

PRICES_FILE = Path(__file__).parent / "prices.json"
CHECKJEBON_URL = (
    "https://raw.githubusercontent.com/supermarkt/checkjebon/main/data/supermarkets.json"
)

# Canonical ingredient catalogue: id -> (display name, pack description).
# Must stay in sync with the ids used by the frontend recipes.
CATALOGUE = {
    "chicken":     ("Chicken breast fillets", "500g"),
    "thighs":      ("Chicken thighs", "500g"),
    "beef":        ("Minced beef", "500g"),
    "salmon":      ("Salmon fillet", "300g / 2 fillets"),
    "whitefish":   ("White fish (pangasius)", "400g"),
    "tuna":        ("Tuna (can, in water)", "1 can"),
    "tofu":        ("Tofu", "400g"),
    "eggs":        ("Eggs", "6-pack"),
    "quark":       ("Low-fat quark", "500g"),
    "yogurt":      ("Greek yogurt", "500g"),
    "cottage":     ("Cottage cheese (hüttenkäse)", "200g"),
    "milk":        ("Semi-skimmed milk", "1L"),
    "rice":        ("Rice", "1kg"),
    "pasta":       ("Pasta", "500g"),
    "wraps":       ("Wholegrain wraps", "6-pack"),
    "bread":       ("Wholegrain bread", "1 loaf"),
    "oats":        ("Oats", "1kg"),
    "couscous":    ("Couscous", "500g"),
    "lentils":     ("Lentils (can)", "1 can"),
    "chickpeas":   ("Chickpeas (can)", "1 can"),
    "blackbeans":  ("Black beans (can)", "1 can"),
    "kidney":      ("Kidney beans (can)", "1 can"),
    "broccoli":    ("Broccoli", "1 piece"),
    "pepper":      ("Bell pepper", "1 piece"),
    "onion":       ("Onion", "1 piece"),
    "garlic":      ("Garlic bulb", "1 bulb"),
    "tomato":      ("Tomatoes", "500g"),
    "passata":     ("Tomato passata", "500g"),
    "spinach":     ("Spinach", "300g"),
    "zucchini":    ("Zucchini (courgette)", "1 piece"),
    "mushrooms":   ("Mushrooms", "250g"),
    "carrot":      ("Carrots", "1kg bag"),
    "cucumber":    ("Cucumber", "1 piece"),
    "cheese":      ("Cheese (Goudse, block)", "400g"),
    "feta":        ("Feta / white cheese", "200g"),
    "oil":         ("Olive oil", "500ml"),
    "spices":      ("Mixed herbs & spices", "jar"),
    "lemon":       ("Lemon", "1 piece"),
    "potato":      ("Potatoes", "2kg bag"),
    "sweetpotato": ("Sweet potatoes", "1kg"),
    "curry":       ("Curry paste", "jar"),
    "coconut":     ("Coconut milk (can)", "1 can"),
    "avocado":     ("Avocado", "1 piece"),
    "almonds":     ("Almonds", "200g"),
    "peanutbutter":("Peanut butter", "350g jar"),
    "banana":      ("Bananas", "1kg"),
}

SAMPLE_PRICES = {
    # id: (ah, lidl) — illustrative fallback data
    "chicken": (4.99, 4.29), "thighs": (3.99, 3.49), "beef": (4.49, 3.99),
    "salmon": (6.99, 6.49), "whitefish": (4.49, 3.99), "tuna": (1.59, 1.29),
    "tofu": (2.29, 1.99), "eggs": (2.09, 1.89), "quark": (1.59, 1.39),
    "yogurt": (1.99, 1.79), "cottage": (1.29, 1.09), "milk": (1.19, 1.05), "rice": (2.19, 1.89),
    "pasta": (1.09, 0.89), "wraps": (1.79, 1.49), "bread": (1.79, 1.49),
    "oats": (1.99, 1.69), "couscous": (1.49, 1.29), "lentils": (0.99, 0.85),
    "chickpeas": (0.89, 0.75), "blackbeans": (0.95, 0.79), "kidney": (0.89, 0.75),
    "broccoli": (1.29, 1.09), "pepper": (0.79, 0.69), "onion": (0.35, 0.29),
    "garlic": (0.59, 0.49), "tomato": (1.49, 1.29), "passata": (0.99, 0.79),
    "spinach": (1.69, 1.49), "zucchini": (0.99, 0.85), "mushrooms": (1.39, 1.19),
    "carrot": (1.09, 0.89), "cucumber": (0.89, 0.75), "cheese": (3.49, 2.99),
    "feta": (1.79, 1.49), "oil": (3.99, 3.49), "spices": (1.29, 1.09),
    "lemon": (0.49, 0.39), "potato": (1.99, 1.69), "sweetpotato": (2.29, 1.99),
    "curry": (1.99, 1.69), "coconut": (1.29, 1.09), "avocado": (1.19, 0.99),
    "almonds": (2.49, 2.19), "peanutbutter": (1.99, 1.69), "banana": (1.49, 1.29),
}


# ---------------------------------------------------------------------------
# Product matching against the checkjebon dataset.
# Per ingredient: q = Dutch query word-sets tried in order; ex = exclude words;
# size = target pack size in g/ml (price is scaled to it via unit price);
# pieces = target piece count; size=None & no pieces = priced per item.
# ---------------------------------------------------------------------------
QUERIES = {
    "chicken":     dict(q=[["kipfilet"]], ex=["plantaardig","gerookt","vegan","testsieger","reep","chips","kruiden","gemarineerd","spies","saus","america","schotel","maaltijd","wortel","schnitzel","krokant","haasjes","cordon","burger","mexicaans"], size=500),
    "thighs":      dict(q=[["kipdijfilet"],["kipdij"]], ex=["plantaardig","gemarineerd","spies","gerookt"], size=500),
    "beef":        dict(q=[["rundergehakt"]], ex=["plantaardig","vegan","kruiden","gekruid","bio"], size=500),
    "salmon":      dict(q=[["zalmfilet"]], ex=["gerookt","blik","nori","wasa","spies"], size=250),
    "whitefish":   dict(q=[["pangasiusfilet"],["pangasius"],["koolvisfilet"]], ex=["paneer","krokant","knoflook","citroen","kruiden"], size=400),
    "tuna":        dict(q=[["tonijn","water"],["tonijnstukken"]], ex=["olijfolie","olie","saus","salade","pizza"], size=None),
    "tofu":        dict(q=[["tofu","naturel"],["tofu"]], ex=["gerookt","gemarineerd","reep"], size=400),
    "eggs":        dict(q=[["scharreleieren"],["eieren"]], ex=["chocolade","paas","kwartel"], size=None, pieces=6),
    "quark":       dict(q=[["magere kwark"],["kwark","naturel"]], ex=["vruchten","aardbei","vanille","perzik","citroen"], size=500),
    "yogurt":      dict(q=[["yoghurt","grieks"],["griekse stijl"],["yoghurt","naturel"]], ex=["vruchten","aardbei","vanille","honing","framboos"], size=500),
    "cottage":     dict(q=[["huttenkase"],["cottage cheese"]], ex=["bieslook","kruiden"], size=200),
    "milk":        dict(q=[["halfvolle melk"]], ex=["houdbaar","houdb","chocolade","lactosevrij"], size=1000),
    "rice":        dict(q=[["zilvervliesrijst"],["witte rijst"],["basmatirijst"]], ex=["gebakken","risotto","noedels","kant"], size=1000),
    "pasta":       dict(q=[["penne"],["spaghetti"],["fusilli"]], ex=["saus","salade","volkoren bio","verse","gevuld"], size=500),
    "wraps":       dict(q=[["volkoren","wraps"],["tortilla","wraps"],["wraps"]], ex=["chips","chia","maal","kit"], size=None, pieces=6),
    "bread":       dict(q=[["volkorenbrood"],["volkoren","brood","heel"],["tarwebrood"]], ex=["spelt","broodjes","mix","meel"], size=800),
    "oats":        dict(q=[["havermout","vlokken"],["havermout"]], ex=["pap","chips","reep","drink","koek","bio"], size=1000),
    "couscous":    dict(q=[["couscous"]], ex=["salade","parel","bloemkool","kant","maal"], size=500),
    "lentils":     dict(q=[["linzen"]], ex=["soep","chips","salade","schotel","olvarit","hutspot","maanden","gedroogd","curry","spread"], size=400),
    "chickpeas":   dict(q=[["kikkererwten"]], ex=["wafel","chips","gedroogd","curry","salade"], size=400),
    "blackbeans":  dict(q=[["zwarte bonen"]], ex=["saus","chips","gedroogd"], size=400),
    "kidney":      dict(q=[["kidneybonen"],["rode nierbonen"]], ex=["chili","gedroogd"], size=400),
    "broccoli":    dict(q=[["broccoli"]], ex=["rijst","soep","mix","puntjes","kiem","schotel","pizza","fish","iglo","vis","pasta"], size=None),
    "pepper":      dict(q=[["paprika","rood"],["paprika"]], ex=["poeder","chips","saus","mix","gegrild","punt trio","zoete"], size=None),
    "onion":       dict(q=[["uien","gele"],["gele ui"],["uien"]], ex=["gebakken","ringen","bosui","zilver","rode","sjalot","soep","poeder"], size=1000),
    "garlic":      dict(q=[["knoflook","vers"],["knoflook"]], ex=["poeder","saus","puree","pasta","brood","boter","olie","croutons","gedroogd","dip","gemalen","geraspt","tomaten","mayo"], size=None),
    "tomato":      dict(q=[["trostomaten"],["tomaten","los"],["tomaten"]], ex=["blik","gezeefd","puree","cherry","gedroogd","soep","saus","ketchup","passata"], size=500),
    "passata":     dict(q=[["passata"],["gezeefde tomaten"]], ex=["kruiden","basilicum"], size=500),
    "spinach":     dict(q=[["spinazie","vers"],["spinazie"]], ex=["creme","pizza","penne","tortelloni","ricotta","soep","stamppot","wok","kant","schotel","lasagne","quiche"], size=300),
    "zucchini":    dict(q=[["courgette"]], ex=["spaghetti","gegrild","soep","spread"], size=None),
    "mushrooms":   dict(q=[["champignons"]], ex=["gebakken","soep","kastanje bio","mix bospaddestoel","gesneden kruiden"], size=250),
    "carrot":      dict(q=[["winterpeen"],["wortelen"],["bospeen"]], ex=["rasp","sap","gesneden mix","soep"], size=1000),
    "cucumber":    dict(q=[["komkommer"]], ex=["salade","zoetzuur","snack"], size=None),
    "cheese":      dict(q=[["goudse","jong belegen","stuk"],["goudse","jong","stuk"],["goudse kaas"]], ex=["plakken bio","geraspt","smeer","28"], size=400),
    "feta":        dict(q=[["feta"],["witte kaas"]], ex=["blokjes olie","kruiden olie","salade","light"], size=200),
    "oil":         dict(q=[["olijfolie","extra vierge"],["olijfolie","traditioneel"],["olijfolie"]], ex=["ansjovis","tonijn","toast","smeerbaar","chili","knoflook","spray","in olijfolie"], size=500),
    "spices":      dict(q=[["italiaanse kruiden"],["paprikapoeder"]], ex=["mix voor","maaltijd","saus","wafel","chips","salade","dressing"], size=None),
    "lemon":       dict(q=[["citroenen"],["citroen"]], ex=["sap","limonade","thee","gras","zeep","kwark","cake","siroop","merengue","water","ice","bruisend","fris","koek","reiniger","geur"], size=None),
    "potato":      dict(q=[["aardappelen","kruimig"],["aardappelen","vastkokend"],["aardappelen"]], ex=["gebakken","schijfjes","puree","gratin","voorgekookt","zoete","salade","frites","friet"], size=2000),
    "sweetpotato": dict(q=[["zoete aardappel"]], ex=["frites","friet","puree","blokjes","chips","partjes","gratin","schijfjes"], size=1000),
    "curry":       dict(q=[["currypasta"],["curry pasta"],["kerriepasta"]], ex=["maaltijd","saus pot kant"], size=None),
    "coconut":     dict(q=[["kokosmelk"]], ex=["drink","light","poeder"], size=400),
    "avocado":     dict(q=[["avocado"]], ex=["spread","dip","olie","guacamole","shot","sap","biet","maaltijd"], size=None),
    "almonds":     dict(q=[["amandelen","ongebrand"],["amandelen","naturel"],["amandelen"]], ex=["gerookt","chocolade","schaafsel","meel","drink","gezouten","kruiden"], size=200),
    "peanutbutter":dict(q=[["pindakaas","naturel"],["pindakaas"]], ex=["stukjes noot bio","100%","poeder"], size=350),
    "banana":      dict(q=[["bananen"]], ex=["chips","brood","gedroogd","melk","bakmix","bak","gesuikerd","snoep","cake","yoghurt","kwark","plant","bananenpl","choco","pancake","cafe","plakjes"], size=1000),
}

def norm(s):
    s = unicodedata.normalize("NFKD", s.lower())
    return "".join(c for c in s if not unicodedata.combining(c))

def parse_size(s):
    if not s: return None
    s = norm(s).replace(",", ".")
    m = re.search(r"([\d.]+)\s*(kg|g|l|ml|liter)", s)
    if m:
        v, u = float(m.group(1)), m.group(2)
        return v * (1000 if u in ("kg", "l", "liter") else 1)
    m = re.search(r"(\d+)\s*(stuks|st\b)", s)
    if m: return ("pieces", int(m.group(1)))
    if "per stuk" in s or s.strip() == "1": return ("pieces", 1)
    return None

def match(products, cfg):
    for words in cfg["q"]:
        cands = []
        for p in products:
            n = norm(p["n"])
            if p["p"] < 0.15: continue  # junk entries
            if all(norm(w) in n for w in words) and not any(norm(x) in n for x in cfg["ex"]):
                cands.append(p)
        if not cands: continue
        target = cfg.get("size")
        want_pieces = cfg.get("pieces")
        scored = []
        for p in cands:
            sz = parse_size(p.get("s", ""))
            if want_pieces:
                if isinstance(sz, tuple) and sz[0] == "pieces":
                    pieces = sz[1]
                    scored.append(((abs(pieces - want_pieces), len(p['n'])), p["p"] / pieces * want_pieces, p))
            elif target:
                if isinstance(sz, (int, float)) and sz >= target * 0.25:
                    unit = p["p"] / sz
                    scored.append(((round(abs(sz - target) / target, 1), len(p['n'])), unit * target, p))
            else:
                scored.append(((0, len(p['n'])), p["p"], p))
        if not scored:  # no size info usable -> cheapest raw
            p = min(cands, key=lambda x: x["p"])
            return round(p["p"], 2), p["n"], p.get("s", "")
        scored.sort(key=lambda t: (t[0], t[1]))
        _, price, p = scored[0]
        return round(price, 2), p["n"], p.get("s", "")
    return None, None, None


_checkjebon_cache: dict | None = None

def _load_checkjebon() -> dict[str, list]:
    """Download the dataset once per run; return {store_key: [products]}."""
    global _checkjebon_cache
    if _checkjebon_cache is None:
        req = urllib.request.Request(
            CHECKJEBON_URL,
            headers={"User-Agent": "boodschappenplanner-price-updater"},
        )
        with urllib.request.urlopen(req, timeout=60) as r:
            data = json.load(r)
        _checkjebon_cache = {s["n"]: s["d"] for s in data}
    return _checkjebon_cache


class StoreAdapter(ABC):
    store_id: str

    @abstractmethod
    def fetch_prices(self) -> dict[str, dict]:
        """Return {ingredient_id: {"price": float, "product": str, "size": str}}."""


class CheckjebonAdapter(StoreAdapter):
    """Prices via the checkjebon open dataset. store_key is checkjebon's
    internal store name ('ah', 'lidl', 'jumbo', ...)."""

    def __init__(self, store_id: str, store_key: str):
        self.store_id = store_id
        self.store_key = store_key

    def fetch_prices(self) -> dict[str, dict]:
        products = _load_checkjebon().get(self.store_key, [])
        out = {}
        for ing, cfg in QUERIES.items():
            price, name, size = match(products, cfg)
            if price is not None:
                out[ing] = {"price": price, "product": name, "size": size}
        return out


# Stores with strong coverage in the checkjebon dataset (>=44/46 ingredients).
# Poiesz (28/46) and Vomar (14/46) are excluded; ALDI and Ekoplaza have empty
# datasets. Add or remove stores by editing this list.
ADAPTERS: list[StoreAdapter] = [
    CheckjebonAdapter("ah", "ah"),
    CheckjebonAdapter("jumbo", "jumbo"),
    CheckjebonAdapter("lidl", "lidl"),
    CheckjebonAdapter("plus", "plus"),
    CheckjebonAdapter("dirk", "dirk"),
    CheckjebonAdapter("spar", "spar"),
    CheckjebonAdapter("hoogvliet", "hoogvliet"),
    CheckjebonAdapter("dekamarkt", "dekamarkt"),
]


def load_previous() -> dict:
    if PRICES_FILE.exists():
        return json.loads(PRICES_FILE.read_text())
    return {}


def build_prices() -> dict:
    previous = load_previous().get("ingredients", {})
    fetched_per_store = {}
    for adapter in ADAPTERS:
        try:
            fetched_per_store[adapter.store_id] = adapter.fetch_prices()
        except Exception as exc:
            print(f"[warn] {adapter.store_id} fetch failed: {exc}")
            fetched_per_store[adapter.store_id] = {}

    ingredients: dict[str, dict] = {}
    for ing_id, (name, pack) in CATALOGUE.items():
        entry = {"name": name, "pack": pack, "matches": {}}
        # prices found across stores, used as fallback average for gaps
        found = [fetched_per_store[a.store_id][ing_id]["price"]
                 for a in ADAPTERS if ing_id in fetched_per_store[a.store_id]]
        avg = round(sum(found) / len(found), 2) if found else None
        for adapter in ADAPTERS:
            store = adapter.store_id
            hit = fetched_per_store[store].get(ing_id)
            if hit:
                entry[store] = round(hit["price"], 2)
                entry["matches"][store] = f'{hit["product"]} ({hit["size"]})'.strip()
            else:
                prev = previous.get(ing_id, {}).get(store)
                if prev is not None:
                    entry[store] = prev
                    entry["matches"][store] = previous.get(ing_id, {}).get(
                        "matches", {}).get(store, "carried over")
                elif avg is not None:
                    entry[store] = avg
                    entry["matches"][store] = "estimate (avg of other stores)"
                else:
                    entry[store] = SAMPLE_PRICES[ing_id][0]
                    entry["matches"][store] = "sample fallback"
        ingredients[ing_id] = entry

    return {
        "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "source": "checkjebon.nl open data (MIT) — github.com/supermarkt/checkjebon",
        "stores": [a.store_id for a in ADAPTERS],
        "ingredients": ingredients,
    }


def main() -> None:
    data = build_prices()
    PRICES_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False))
    n_fallback = sum(
        1 for e in data["ingredients"].values()
        for s in data["stores"]
        if not e["matches"].get(s) or "(" not in e["matches"][s]
    )
    print(f"Wrote {PRICES_FILE}: {len(data['ingredients'])} ingredients, "
          f"{n_fallback} store-item fallbacks, at {data['updated_at']}")


if __name__ == "__main__":
    main()
