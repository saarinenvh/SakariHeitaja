"""
Shared scenario definitions and brief builder for training data generation.
Mirrors the TypeScript CommentaryBrief logic.
"""

import random

PLAYER_NAMES = [
    "Teppo Nieminen", "Ville Saarinen", "Tommi Leinonen",
    "Janne Korhonen", "Mikko Virtanen", "Pekka Mäkinen",
    "Riku Heikkinen", "Pauli Järvinen",
]

REACTION_GOOD = [
    "MAHTAVA SUORITUS!", "USKOMATON TEKO!", "Wouuuuu, kyllä nyt kelpaa!",
    "Kyllä nyt ollaan sankareita!", "WOUUUUU!", "No nyt taas!",
    "Olikohan vahinko, ei tämmöstä yleensä nähä!",
    "JUMALISTE! Oiskohan sittenki vielä sauma mitaleille!",
    "Tämmöstä! Tämmöstä sen olla pitää!",
    "Tää dude on iha samaa tasoo ku pauli tai riki!",
]

REACTION_NEUTRAL = [
    "Onpahan tylsää...", "Nyt kun olisi aika hyökätä, niin mitä hän tekee?",
    "Ei tälläsellä pelillä kyllä mitaleille mennä :X",
    "On se ihannetuloskin tulos, kun", "buuuu!",
    "Hienosti! Vaikea väylä, mutta kyllä kelpaa.",
    "Ei huono!", "Joopajoooooo...",
    "Noh aika harvat tällä väylällä paremmin heittää.",
]

REACTION_BAD = [
    "Voi surkujen surku!", "Voi kyynelten kyynel!", "Saatana vois tää spede vaik denffata.",
    "Kannattiko ees tulla näihin kisoihin??", "Säälittävää tekemistä taas...",
    "Naurettavaa toimintaa!", "HAHAHAHAHAHA!",
    "Ei vittu, jopa mä oisin pöröttänu ton mut ei...",
    "Vittu mitä paskaa, ei kiinnosta ees seurata tätä pelii jos taso on tää!!",
    "PERSE! Tsemppiä nyt saatana!", "No nyt oli kyllä paskaa tuuria!",
]

SCORE_SLANG = {
    "ace":         ["ÄSSÄN!"],
    "eagle":       ["eaglen", "KOTKAN", "EAGLEN"],
    "albatross":   ["ALBATROSSIN??"],
    "birdie":      ["birdien", "lintusen", "tirpan", "pörön", "pirkon"],
    "par":         ["paarin", "ihannetuloksen", "hemmetin tylsän paarin", "tuuripaarin", "taitopaarin"],
    "bogey":       ["bogin", "boggelin", "turhan bogin", "ruskean boggelin"],
    "doubleBogey": ["ruman tuplabogin", "kaks päälle", "DOUBLE BOGEYN"],
    "worse":       ["ison ylityksen"],
}

VERBS = [
    "otti", "sai", "suoritti", "möyri", "heitti", "viskoi",
    "rämisteli", "scrambläsi", "paiskasi", "nakkeli", "lapioi", "viimeisteli",
]

STANDING_IMPACTS = [
    "nousi yksin johtoon",
    "nousi tasajohtonn",
    "putosi johdosta",
    "tasatilanteessa johdossa",
    "johtaa edelleen",
    "aivan johtajan takana",
    "kirinyt lähemmäs kärkeä",
]

def get_score_type(diff: int, result: str) -> str:
    if result == "1":
        return "ace"
    if diff <= -3:
        return "albatross"
    if diff == -2:
        return "eagle"
    if diff == -1:
        return "birdie"
    if diff == 0:
        return "par"
    if diff == 1:
        return "bogey"
    if diff == 2:
        return "doubleBogey"
    return "worse"

def get_score_label(diff: int, result: str) -> str:
    score_type = get_score_type(diff, result)
    labels = {
        "ace": "ässä (hole-in-one)",
        "albatross": "albatrossi",
        "eagle": "kotka (eagle)",
        "birdie": "birdie",
        "par": "par",
        "bogey": "bogi",
        "doubleBogey": "tuplabogi",
        "worse": f"iso ylitys (+{diff})",
    }
    return labels[score_type]

def get_event_quality(score_type: str) -> str:
    if score_type in ("ace", "eagle", "albatross", "birdie"):
        return "good"
    if score_type == "par":
        return "neutral"
    return "bad"

def build_brief_prompt(brief: dict) -> str:
    lines = [
        f"Pelaaja: {brief['playerName']}",
        f"Tulos: {brief['holeScoreLabel']}" + (" + OB" if brief.get("ob") else ""),
        f"Tapahtuma: {brief['eventQuality']}",
    ]
    if brief.get("positionChange") == "moved_up":
        lines.append("Sijoitusvaikutus: nousi sijoituksissa")
    elif brief.get("positionChange") == "moved_down":
        lines.append("Sijoitusvaikutus: putosi sijoituksissa")
    if brief.get("standingImpact"):
        lines.append(f"Kisatilanne: {brief['standingImpact']}")
    if brief.get("pressureMoment"):
        lines.append("Vaihe: loppukiri, paine päällä")
    lines.append("")

    reaction_pool = (
        REACTION_GOOD if brief["eventQuality"] == "good"
        else REACTION_NEUTRAL if brief["eventQuality"] == "neutral"
        else REACTION_BAD
    )
    score_type = brief.get("scoreType", "par")
    slang_pool = SCORE_SLANG.get(score_type, ["tuloksen"])

    reaction_hints = random.sample(reaction_pool, min(2, len(reaction_pool)))
    slang_hints = random.sample(slang_pool, min(2, len(slang_pool)))
    verb_hints = random.sample(VERBS, 2)

    lines.append(f"Reaktio lause 1:een (inspiraatioksi — älä kopioi suoraan, keksi oma): {', '.join(reaction_hints)}")
    lines.append(f"Tuloksen nimi lause 1:een (inspiraatioksi — älä kopioi suoraan): {', '.join(slang_hints)}")
    lines.append(f"Verbi lause 1:een (inspiraatioksi): {', '.join(verb_hints)}")
    lines.append("")

    needs_third = bool(brief.get("standingImpact") or brief.get("pressureMoment"))
    lines.append("Kirjoita 3 lausetta. Kolmas lause: lyhyt reaktio kisatilanteeseen." if needs_third else "Kirjoita 2 lausetta.")

    return "\n".join(lines)


def generate_scenarios() -> list[dict]:
    """
    Generate a diverse set of training scenarios covering all
    meaningful CommentaryBrief combinations.
    """
    scenarios = []

    # (diff, result_str, ob, positionChange, standingImpact, pressureMoment, phase)
    base_cases = [
        # Ace
        (-5, "1", False, "moved_up", "nousi yksin johtoon", False, "mid"),
        # Eagle
        (-2, "2", False, "moved_up", "nousi yksin johtoon", False, "mid"),
        (-2, "2", False, "moved_up", None, False, "early"),
        (-2, "2", True,  "moved_up", "aivan johtajan takana", False, "late"),
        # Birdie
        (-1, "3", False, "moved_up", "nousi yksin johtoon", True, "late"),
        (-1, "3", False, "moved_up", "nousi tasajohtonn", False, "late"),
        (-1, "3", False, "moved_up", "aivan johtajan takana", True, "late"),
        (-1, "3", False, "moved_up", "kirinyt lähemmäs kärkeä", False, "mid"),
        (-1, "3", False, "no_change", None, False, "early"),
        (-1, "3", False, "no_change", None, False, "mid"),
        (-1, "3", True,  "moved_up", None, False, "mid"),
        (-1, "3", False, "moved_up", "johtaa edelleen", True, "late"),
        # Par
        (0, "3",  False, "no_change", None, False, "early"),
        (0, "3",  False, "no_change", None, False, "mid"),
        (0, "3",  False, "no_change", "johtaa edelleen", False, "late"),
        (0, "3",  False, "no_change", "aivan johtajan takana", True, "late"),
        (0, "4",  True,  "moved_down", None, False, "mid"),
        (0, "3",  False, "moved_down", None, False, "mid"),
        (0, "5",  False, "no_change", None, False, "early"),
        (0, "3",  False, "no_change", "tasatilanteessa johdossa", False, "late"),
        # Bogey
        (1, "4",  False, "moved_down", "putosi johdosta", False, "late"),
        (1, "4",  False, "moved_down", None, False, "early"),
        (1, "4",  False, "moved_down", None, False, "mid"),
        (1, "5",  True,  "moved_down", None, False, "mid"),
        (1, "4",  False, "moved_down", "putosi johdosta", True, "late"),
        (1, "4",  False, "no_change", None, False, "mid"),
        (1, "4",  True,  "moved_down", "aivan johtajan takana", False, "late"),
        (1, "4",  False, "moved_down", None, False, "late"),
        # DoubleBogey
        (2, "5",  False, "moved_down", None, False, "mid"),
        (2, "5",  False, "moved_down", "putosi johdosta", True, "late"),
        (2, "5",  True,  "moved_down", None, False, "mid"),
        (2, "6",  False, "moved_down", None, False, "early"),
        (2, "5",  False, "moved_down", None, False, "late"),
        (2, "5",  True,  "moved_down", "putosi johdosta", True, "late"),
        # Worse (+3 and above)
        (3, "7",  False, "moved_down", None, False, "mid"),
        (4, "8",  True,  "moved_down", None, False, "mid"),
        (3, "7",  False, "moved_down", "putosi johdosta", False, "late"),
    ]

    names = PLAYER_NAMES.copy()
    for i, (diff, result, ob, pos_change, standing, pressure, phase) in enumerate(base_cases):
        name = names[i % len(names)]
        score_type = get_score_type(diff, result)
        quality = get_event_quality(score_type)

        brief = {
            "playerName": name,
            "holeNumber": random.randint(1, 18),
            "holeScoreLabel": get_score_label(diff, result),
            "scoreType": score_type,
            "eventQuality": quality,
            "ob": ob,
            "positionChange": pos_change,
            "standingImpact": standing,
            "competitionPhase": phase,
            "pressureMoment": pressure,
        }
        scenarios.append(brief)

    return scenarios
