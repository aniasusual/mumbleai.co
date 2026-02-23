"""
Supported languages for Mumble AI.
All languages supported by OpenAI Whisper STT + TTS.
"""

SUPPORTED_LANGUAGES = {
    "af": {"name": "Afrikaans", "native": "Afrikaans", "flag": "ZA"},
    "am": {"name": "Amharic", "native": "\u12a0\u121b\u122d\u129b", "flag": "ET"},
    "ar": {"name": "Arabic", "native": "\u0627\u0644\u0639\u0631\u0628\u064a\u0629", "flag": "SA"},
    "as": {"name": "Assamese", "native": "\u0985\u09b8\u09ae\u09c0\u09af\u09bc\u09be", "flag": "IN"},
    "az": {"name": "Azerbaijani", "native": "Az\u0259rbaycanca", "flag": "AZ"},
    "ba": {"name": "Bashkir", "native": "\u0411\u0430\u0448\u04a1\u043e\u0440\u0442", "flag": "RU"},
    "be": {"name": "Belarusian", "native": "\u0411\u0435\u043b\u0430\u0440\u0443\u0441\u043a\u0430\u044f", "flag": "BY"},
    "bg": {"name": "Bulgarian", "native": "\u0411\u044a\u043b\u0433\u0430\u0440\u0441\u043a\u0438", "flag": "BG"},
    "bn": {"name": "Bengali", "native": "\u09ac\u09be\u0982\u09b2\u09be", "flag": "BD"},
    "bo": {"name": "Tibetan", "native": "\u0f56\u0f7c\u0f51\u0f0b\u0f66\u0f90\u0f51", "flag": "CN"},
    "br": {"name": "Breton", "native": "Brezhoneg", "flag": "FR"},
    "bs": {"name": "Bosnian", "native": "Bosanski", "flag": "BA"},
    "ca": {"name": "Catalan", "native": "Catal\u00e0", "flag": "ES"},
    "cs": {"name": "Czech", "native": "\u010ce\u0161tina", "flag": "CZ"},
    "cy": {"name": "Welsh", "native": "Cymraeg", "flag": "GB"},
    "da": {"name": "Danish", "native": "Dansk", "flag": "DK"},
    "de": {"name": "German", "native": "Deutsch", "flag": "DE"},
    "el": {"name": "Greek", "native": "\u0395\u03bb\u03bb\u03b7\u03bd\u03b9\u03ba\u03ac", "flag": "GR"},
    "en": {"name": "English", "native": "English", "flag": "US"},
    "es": {"name": "Spanish", "native": "Espa\u00f1ol", "flag": "ES"},
    "et": {"name": "Estonian", "native": "Eesti", "flag": "EE"},
    "eu": {"name": "Basque", "native": "Euskara", "flag": "ES"},
    "fa": {"name": "Persian", "native": "\u0641\u0627\u0631\u0633\u06cc", "flag": "IR"},
    "fi": {"name": "Finnish", "native": "Suomi", "flag": "FI"},
    "fo": {"name": "Faroese", "native": "F\u00f8royskt", "flag": "FO"},
    "fr": {"name": "French", "native": "Fran\u00e7ais", "flag": "FR"},
    "gl": {"name": "Galician", "native": "Galego", "flag": "ES"},
    "gu": {"name": "Gujarati", "native": "\u0a97\u0ac1\u0a9c\u0ab0\u0abe\u0aa4\u0ac0", "flag": "IN"},
    "ha": {"name": "Hausa", "native": "Hausa", "flag": "NG"},
    "haw": {"name": "Hawaiian", "native": "\u02bbOlelo Hawai\u02bbi", "flag": "US"},
    "he": {"name": "Hebrew", "native": "\u05e2\u05d1\u05e8\u05d9\u05ea", "flag": "IL"},
    "hi": {"name": "Hindi", "native": "\u0939\u093f\u0928\u094d\u0926\u0940", "flag": "IN"},
    "hr": {"name": "Croatian", "native": "Hrvatski", "flag": "HR"},
    "ht": {"name": "Haitian Creole", "native": "Krey\u00f2l ayisyen", "flag": "HT"},
    "hu": {"name": "Hungarian", "native": "Magyar", "flag": "HU"},
    "hy": {"name": "Armenian", "native": "\u0540\u0561\u0575\u0565\u0580\u0565\u0576", "flag": "AM"},
    "id": {"name": "Indonesian", "native": "Bahasa Indonesia", "flag": "ID"},
    "is": {"name": "Icelandic", "native": "\u00cdslenska", "flag": "IS"},
    "it": {"name": "Italian", "native": "Italiano", "flag": "IT"},
    "ja": {"name": "Japanese", "native": "\u65e5\u672c\u8a9e", "flag": "JP"},
    "jw": {"name": "Javanese", "native": "Basa Jawa", "flag": "ID"},
    "ka": {"name": "Georgian", "native": "\u10e5\u10d0\u10e0\u10d7\u10e3\u10da\u10d8", "flag": "GE"},
    "kk": {"name": "Kazakh", "native": "\u049a\u0430\u0437\u0430\u049b", "flag": "KZ"},
    "km": {"name": "Khmer", "native": "\u1781\u17d2\u1798\u17c2\u179a", "flag": "KH"},
    "kn": {"name": "Kannada", "native": "\u0c95\u0ca8\u0ccd\u0ca8\u0ca1", "flag": "IN"},
    "ko": {"name": "Korean", "native": "\ud55c\uad6d\uc5b4", "flag": "KR"},
    "la": {"name": "Latin", "native": "Latina", "flag": "VA"},
    "lb": {"name": "Luxembourgish", "native": "L\u00ebtzebuergesch", "flag": "LU"},
    "ln": {"name": "Lingala", "native": "Ling\u00e1la", "flag": "CD"},
    "lo": {"name": "Lao", "native": "\u0ea5\u0eb2\u0ea7", "flag": "LA"},
    "lt": {"name": "Lithuanian", "native": "Lietuvi\u0173", "flag": "LT"},
    "lv": {"name": "Latvian", "native": "Latvie\u0161u", "flag": "LV"},
    "mg": {"name": "Malagasy", "native": "Malagasy", "flag": "MG"},
    "mi": {"name": "Maori", "native": "Te Reo M\u0101ori", "flag": "NZ"},
    "mk": {"name": "Macedonian", "native": "\u041c\u0430\u043a\u0435\u0434\u043e\u043d\u0441\u043a\u0438", "flag": "MK"},
    "ml": {"name": "Malayalam", "native": "\u0d2e\u0d32\u0d2f\u0d3e\u0d33\u0d02", "flag": "IN"},
    "mn": {"name": "Mongolian", "native": "\u041c\u043e\u043d\u0433\u043e\u043b", "flag": "MN"},
    "mr": {"name": "Marathi", "native": "\u092e\u0930\u093e\u0920\u0940", "flag": "IN"},
    "ms": {"name": "Malay", "native": "Bahasa Melayu", "flag": "MY"},
    "mt": {"name": "Maltese", "native": "Malti", "flag": "MT"},
    "my": {"name": "Myanmar", "native": "\u1019\u103c\u1014\u103a\u1019\u102c", "flag": "MM"},
    "ne": {"name": "Nepali", "native": "\u0928\u0947\u092a\u093e\u0932\u0940", "flag": "NP"},
    "nl": {"name": "Dutch", "native": "Nederlands", "flag": "NL"},
    "nn": {"name": "Nynorsk", "native": "Nynorsk", "flag": "NO"},
    "no": {"name": "Norwegian", "native": "Norsk", "flag": "NO"},
    "oc": {"name": "Occitan", "native": "Occitan", "flag": "FR"},
    "pa": {"name": "Punjabi", "native": "\u0a2a\u0a70\u0a1c\u0a3e\u0a2c\u0a40", "flag": "IN"},
    "pl": {"name": "Polish", "native": "Polski", "flag": "PL"},
    "ps": {"name": "Pashto", "native": "\u067e\u069a\u062a\u0648", "flag": "AF"},
    "pt": {"name": "Portuguese", "native": "Portugu\u00eas", "flag": "BR"},
    "ro": {"name": "Romanian", "native": "Rom\u00e2n\u0103", "flag": "RO"},
    "ru": {"name": "Russian", "native": "\u0420\u0443\u0441\u0441\u043a\u0438\u0439", "flag": "RU"},
    "sa": {"name": "Sanskrit", "native": "\u0938\u0902\u0938\u094d\u0915\u0943\u0924\u092e\u094d", "flag": "IN"},
    "sd": {"name": "Sindhi", "native": "\u0633\u0646\u068c\u064a", "flag": "PK"},
    "si": {"name": "Sinhala", "native": "\u0dc3\u0dd2\u0d82\u0dc4\u0dbd", "flag": "LK"},
    "sk": {"name": "Slovak", "native": "Sloven\u010dina", "flag": "SK"},
    "sl": {"name": "Slovenian", "native": "Sloven\u0161\u010dina", "flag": "SI"},
    "sn": {"name": "Shona", "native": "ChiShona", "flag": "ZW"},
    "so": {"name": "Somali", "native": "Soomaali", "flag": "SO"},
    "sq": {"name": "Albanian", "native": "Shqip", "flag": "AL"},
    "sr": {"name": "Serbian", "native": "\u0421\u0440\u043f\u0441\u043a\u0438", "flag": "RS"},
    "su": {"name": "Sundanese", "native": "Basa Sunda", "flag": "ID"},
    "sv": {"name": "Swedish", "native": "Svenska", "flag": "SE"},
    "sw": {"name": "Swahili", "native": "Kiswahili", "flag": "KE"},
    "ta": {"name": "Tamil", "native": "\u0ba4\u0bae\u0bbf\u0bb4\u0bcd", "flag": "IN"},
    "te": {"name": "Telugu", "native": "\u0c24\u0c46\u0c32\u0c41\u0c17\u0c41", "flag": "IN"},
    "tg": {"name": "Tajik", "native": "\u0422\u043e\u04b7\u0438\u043a\u04e3", "flag": "TJ"},
    "th": {"name": "Thai", "native": "\u0e44\u0e17\u0e22", "flag": "TH"},
    "tk": {"name": "Turkmen", "native": "T\u00fcrkmen", "flag": "TM"},
    "tl": {"name": "Tagalog", "native": "Tagalog", "flag": "PH"},
    "tr": {"name": "Turkish", "native": "T\u00fcrk\u00e7e", "flag": "TR"},
    "tt": {"name": "Tatar", "native": "\u0422\u0430\u0442\u0430\u0440", "flag": "RU"},
    "uk": {"name": "Ukrainian", "native": "\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430", "flag": "UA"},
    "ur": {"name": "Urdu", "native": "\u0627\u0631\u062f\u0648", "flag": "PK"},
    "uz": {"name": "Uzbek", "native": "O\u02bbzbek", "flag": "UZ"},
    "vi": {"name": "Vietnamese", "native": "Ti\u1ebfng Vi\u1ec7t", "flag": "VN"},
    "yo": {"name": "Yoruba", "native": "Yor\u00f9b\u00e1", "flag": "NG"},
    "zh": {"name": "Chinese", "native": "\u4e2d\u6587", "flag": "CN"},
    "zu": {"name": "Zulu", "native": "isiZulu", "flag": "ZA"},
}

# Popular languages shown first in the selector
POPULAR_LANGUAGE_CODES = [
    "en", "es", "fr", "de", "it", "pt", "ja", "ko", "zh",
    "ar", "hi", "ru", "nl", "sv", "pl", "tr", "th", "vi",
    "id", "cs", "da", "fi", "el", "he", "hu", "no", "ro",
    "uk", "bn", "ta", "te", "mr", "gu", "kn", "ml", "pa",
    "sw", "tl", "ms", "fa", "ur"
]


def get_language_name(code: str) -> str:
    lang = SUPPORTED_LANGUAGES.get(code)
    return lang["name"] if lang else code


def get_all_languages_sorted():
    """Return all languages, popular ones first, then alphabetical."""
    popular = []
    others = []
    for code in POPULAR_LANGUAGE_CODES:
        if code in SUPPORTED_LANGUAGES:
            popular.append({"code": code, **SUPPORTED_LANGUAGES[code]})
    for code, data in sorted(SUPPORTED_LANGUAGES.items(), key=lambda x: x[1]["name"]):
        if code not in POPULAR_LANGUAGE_CODES:
            others.append({"code": code, **data})
    return popular, others
