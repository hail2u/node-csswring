const re = exports;

// 123grad
re.angle = /(^|\s|\(|,)([1-9]\d*)(grad)/gi;

// calc(1 + 1)
re.calcFunction = /(^|\s|\(|,)calc\((([^()]*(\([^()]*\))?)*)\)/;

// rgb(0, 0, 0), hsl(0, 0%, 0%), rgba(0, 0, 0, 1), hsla(0, 0%, 0%, 1)
re.colorFunction = /(^|\s|\(|,)((?:rgb|hsl)a?\(.*?\))/gi;

// #000, #000000
re.colorHex = /(^|\s|\(|,)#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])/gi;

// rgba(0,0,0,0)
re.colorTransparent = /(^|\s|\(|,)rgba\(0,0,0,0\)/gi;

// 0.1
re.decimalWithZeros = /(^|\s|\(|,)(-)?0*([1-9]\d*)?\.(\d*[1-9])0*/g;

// (top: 0)
re.declInParentheses = /\(([-a-zA-Z]+):(([^()]*(\([^()]*\))?)*)\)/g;

// font-style, font-stretch, font-variant, font-feature-settings
re.descriptorFontFace = /^font-(style|stretch|variant|feature-settings)$/i;

// \(, \)
re.escapedBraces = /\\([()])/g;

// 1000Hz
re.freqEndsWithThreeZeros = /(^|\s|\(|,)(\d+)000Hz/gi;

// /**/, /*\**/
re.hackPropComment = /\/\*(\\\*)?\*\//;

// _, *
re.hackSignProp = /[_*]$/;

// 0
re.number = /\d/;

// 01
re.numberLeadingZeros = /(^|\s|\(|,)0+([1-9]\d*(\.\d+)?)/g;

// margin, padding, border-color, border-radius, border-spacing, border-style, border-width
re.propertyMultipleValues = /^(margin|padding|border-(color|radius|spacing|style|width))$/i;

// "...", '...'
re.quotedString = /("|')?(.*)\1/;

// [class = "foo"], [class ~= "foo"], [class |= "foo"], [class ^= "foo"], [class $= "foo"], [class *= "foo"]
re.selectorAtt = /\[\s*(.*?)(?:\s*([~|^$*]?=)\s*(("|').*\4|.*?[^\\]))?\s*(i)?\]/g;

// p > a, p + a, p ~ a
re.selectorCombinators = /\s+((\\?)[>+~])\s+/g;

// :lang(ja), :nth-child(0), nth-last-child(0), nth-of-type(1n), nth-last-of-type(1n)
re.selectorFunctions = /:(lang|nth-(?:last-)?(?:child|of-type))\((.*?[^\\])\)/gi;

// :not(a)
re.selectorNegationFunction = /:not\((([^()]*(\([^()]*\))?)*)\)/gi;

// ::before, ::after, ::first-line, ::first-letter
re.selectorPseudoElements = /(:)\1(?=after|before|first-(letter|line))/g;

// *#foo, *.bar, *:link, *[baz]
re.selectorVerboseUniversal = /\*([#.:[])/g;

// ;
re.semicolons = /;/g;

// ident-ifi-ers
re.sequenceOfIdentifiers = /^[\w-]+$/;

// 3210ms
re.timeEndsWithZero = /(^|\s|\(|,)(\d{2,})0ms/gi;

// u0-10ffff, u000000-10ffff
re.unicodeRangeDefault = /u\+0{1,6}-10ffff/i;

// url(a)
re.urlFunction = /(^|\s|\(|,)url\((.*?[^\\])\)(?=$|\s|\)|,)/gi;

//  , (, ), ", '
re.urlNeedQuote = /[\s()"']/;

// --valid_prop-name
re.validProp = /^-{0,2}[^!-,./:-@[-^`{-~]+$/i;

// var(--custom-prop-name)
re.varFunction = /^var\([\w-]+\)$/i;

//  , \t, \r, \n
re.whiteSpaces = /\s+/g;
re.whiteSpacesAfterSymbol = /([(,:])\s/g;
re.whiteSpacesBeforeSymbol = /\s([),:])/g;
re.whiteSpacesBothEndsOfSymbol = /\s([*/])\s/g;

// 0%, 0ch, 0cm, 0deg, 0dpcm, 0dpi, 0dppx, 0em, 0ex, 0grad, 0Hz, 0in, 0kHz, 0mm,
// 0ms, 0pc, 0pt, 0px, 0rad, 0rem, 0s, 0turn, 0vh, 0vmax, 0vmin, 0vw
re.zeroValueUnit = /(^|\s|\(|,)(0)(%|ch|cm|deg|dpcm|dpi|dppx|em|ex|grad|Hz|in|kHz|mm|ms|pc|pt|px|rad|rem|s|turn|vh|vmax|vmin|vw)/gi;
