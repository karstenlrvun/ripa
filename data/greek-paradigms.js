/* ======================================================================
   Cotidie — Greek paradigm data ("Systems" in the plan's taxonomy)
   ======================================================================

   Scope, set 2026-08-06 after reviewing the actual OCR A Level in
   Classical Greek (H444) specification (§5d, "Classical Greek Accidence
   and Syntax" -- fetched and read directly, not assumed): the real
   syllabus requires "verbs of all standard types, common irregular,
   impersonal and defective verbs from both conjugations [thematic and
   athematic] in all moods, voices and tenses." That is enormous. v1 here
   is a deliberate SLICE of it, at Karsten's explicit direction:
     - INDICATIVE MOOD ONLY. Subjunctive, optative, imperative, and the
       participle/infinitive system are all future work.
     - Present, imperfect, future, aorist, perfect, pluperfect, and future
       perfect (mp only -- see below) for the one thematic paradigm verb.
     - Six athematic (-μι) verbs, present/imperfect/future only (their
       aorist and perfect systems are future work).
     - Noun cases: nominative, vocative, accusative, genitive, dative.
       No ablative (Greek doesn't have one) and, per the OCR spec itself,
       NO DUAL NUMBER ("A knowledge of the dual form will not be
       required") -- singular/plural only, same cellKeys shape as Latin.
   Also confirmed directly from that spec, which changes a default from
   what the original Cotidianum plan assumed: "Learners will not be
   expected to WRITE accents, but should be able to distinguish words of
   identical spelling but with differing accentuation" -- so accent
   grading defaults OFF (recognition only), while "learners will be
   expected to write breathing marks" -- so breathing grading defaults ON.
   Both stay toggleable (js/greek.js), this only sets the default.

   ---- Why nouns and most verbs are `literal: true` here, unlike Latin ----
   Latin's regular endings are pure suffix concatenation with no further
   surprises once macrons are graded away. Greek accent is NOT like that:
   it's "persistent" (stays on the syllable it occupies in the citation
   form, as far as later rules allow) for nouns, and while verb accent is
   "recessive" (as far back as allowed) it still depends on the specific
   word's syllable count and vowel lengths. Concretely, the -ης
   masculine's vocative singular (e.g. πολῖτα, short vowel + shifted
   accent, genuinely not "stem + ending") is one visible symptom of a
   much broader fact: a stem+ending FORMULA verified correct for one word
   is not safely assumed correct for a second, differently-accented word
   in "the same declension." Rather than build (and get subtly wrong
   under time pressure) a real accent-recession rule engine, EVERY class
   in this file is `literal: true` -- hand-written, per HANDOFF.md's
   "verify don't guess" rule, and deliberately ONE example word per class
   for v1 (see *_VOCAB below). This includes lyo itself: its
   present/imperfect/future/aorist really is clean root+ending, but the
   perfect system runs on the REDUPLICATED stem (le-ly-) instead of the
   bare root, and this engine has no reduplication mechanism -- rather
   than mix "mostly formula, but three categories secretly need a
   different base" (exactly the shape that invites a silent bug), every
   one of its ~90 cells is written out fully too. All were individually
   cross-checked against two independent sources (Wiktionary and Wm.
   Jones White's "First Greek Book" via daedalus.umkc.edu) while this
   file was written. Expanding any class beyond its one example word
   needs either per-word accent verification or, for the thematic class,
   a real reduplication + accent-recession engine -- tracked as an open
   item in HANDOFF.md, not silently assumed away.

   ---- Data shape ----
   Same shape as latin-paradigms.js: kind, label, subtitle, example,
   categories (recitation order), cellKeys, endings[category][cell],
   optionally `literal: true` (see js/engine.js's formsFor()). Greek has
   no FROM_LEMMA cells -- literal classes just write every cell out fully
   instead, which subsumes what FROM_LEMMA was for.
   ====================================================================== */

const GREEK_PARADIGMS = {

  /* ---------------------------------------------------------------------
     THE ARTICLE -- the first `kind: 'adj'` class, and the reason the gender
     axis exists.

     Gender used to be a property of the WORD (τιμή is feminine, full stop),
     which is right for a noun and useless for everything else: the article,
     every adjective and every participle vary across all three genders
     within one lemma. So for these classes the gender lives in the CELL key
     -- 'm.sg', 'f.pl' -- with the case staying the category, matching the
     convention the noun classes already use. formsFor() needs no change at
     all; only orderedCells() had to learn the shape, and it recites these
     gender-major (all the masculine, then the feminine, then the neuter),
     which is how the tables are printed and how they are said aloud.

     NO VOCATIVE: the article has none, so its categories are four where
     every noun class here has five. That is the ragged-paradigm fix earning
     its keep on real data rather than a test fixture.

     Hand-authored, not generated -- the article is suppletive (ὁ / τοῦ is
     not stem + ending by any rule), so no inflection engine can produce it.
     Accents are as printed: ὁ, ἡ, οἱ, αἱ are proclitics and carry a rough
     breathing but no accent. Breathings are always graded here, so those
     four matter even with accent grading off.
     --------------------------------------------------------------------- */
  article: {
    kind: 'adj', label: 'The Article', literal: true,
    subtitle: 'ὁ, ἡ, τό — the',
    example: { lemma:'ὁ, ἡ, τό', class:'article', meaning:'the' },
    genders: ['m','f','n'],
    categories: ['nom','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { 'm.sg':'ὁ',   'f.sg':'ἡ',   'n.sg':'τό',
             'm.pl':'οἱ',  'f.pl':'αἱ',  'n.pl':'τά'  },
      acc: { 'm.sg':'τόν', 'f.sg':'τήν', 'n.sg':'τό',
             'm.pl':'τούς','f.pl':'τάς', 'n.pl':'τά'  },
      gen: { 'm.sg':'τοῦ', 'f.sg':'τῆς', 'n.sg':'τοῦ',
             'm.pl':'τῶν', 'f.pl':'τῶν', 'n.pl':'τῶν' },
      dat: { 'm.sg':'τῷ',  'f.sg':'τῇ',  'n.sg':'τῷ',
             'm.pl':'τοῖς','f.pl':'ταῖς','n.pl':'τοῖς' }
    }
  },


  /* ---- nouns (one example word each; see the note above on why) ---- */

  /* ---------------------------------------------------------------------
     ADJECTIVES AND PRONOUNS -- the first tranche generated rather than typed.

     Produced by tools/verify/gen_greek_adecl.py from Wiktionary's own
     grc-adecl module, then checked back against it by verify_greek.py, then
     committed as plain literal data: the app gains no runtime dependency and
     makes no network call at study time. That is the pipeline the buildout
     plan specifies for the nominal half, which no inflection generator can do
     (greek-inflexion has no adjective code path at all).

     Every one was adjudicated by hand before it went in:
       - αὐτός's vocative is dropped. The generator offered ἀὐτέ because the
         word is a 2-1-2 adjective by shape, but the intensive pronoun is not
         addressed and no standard table prints one.
       - οὗτος and ἐκεῖνος have no vocative at all; the generator reported the
         case as 2-of-6 present and dropped it, which is the right answer for
         the right reason.
       - ἀγαθός keeps its vocative: it is a real adjective and ἀγαθέ is real.
     --------------------------------------------------------------------- */
  adj_os_h_on: {
    kind: 'adj', label: 'Adjectives in -ος, -η, -ον', literal: true,
    subtitle: 'ἀγαθός, ἀγαθή, ἀγαθόν — good',
    example: { lemma:'ἀγαθός, -ή, -όν', class:'adj_os_h_on', meaning:'good' },
    genders: ['m','f','n'],
    categories: ['nom','voc','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { 'm.sg':'ἀγαθός', 'f.sg':'ἀγαθή', 'n.sg':'ἀγαθόν',
             'm.pl':'ἀγαθοί', 'f.pl':'ἀγαθαί', 'n.pl':'ἀγαθά' },
      voc: { 'm.sg':'ἀγαθέ', 'f.sg':'ἀγαθή', 'n.sg':'ἀγαθόν',
             'm.pl':'ἀγαθοί', 'f.pl':'ἀγαθαί', 'n.pl':'ἀγαθά' },
      acc: { 'm.sg':'ἀγαθόν', 'f.sg':'ἀγαθήν', 'n.sg':'ἀγαθόν',
             'm.pl':'ἀγαθούς', 'f.pl':'ἀγαθάς', 'n.pl':'ἀγαθά' },
      gen: { 'm.sg':'ἀγαθοῦ', 'f.sg':'ἀγαθῆς', 'n.sg':'ἀγαθοῦ',
             'm.pl':'ἀγαθῶν', 'f.pl':'ἀγαθῶν', 'n.pl':'ἀγαθῶν' },
      dat: { 'm.sg':'ἀγαθῷ', 'f.sg':'ἀγαθῇ', 'n.sg':'ἀγαθῷ',
             'm.pl':'ἀγαθοῖς', 'f.pl':'ἀγαθαῖς', 'n.pl':'ἀγαθοῖς' }
    }
  },

  pron_autos: {
    kind: 'adj', label: 'αὐτός (self, same, him/her/it)', literal: true,
    subtitle: 'αὐτός, αὐτή, αὐτό',
    example: { lemma:'αὐτός, -ή, -ό', class:'pron_autos', meaning:'self; him, her, it' },
    genders: ['m','f','n'],
    categories: ['nom','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { 'm.sg':'αὐτός', 'f.sg':'αὐτή', 'n.sg':'αὐτό',
             'm.pl':'αὐτοί', 'f.pl':'αὐταί', 'n.pl':'αὐτά' },
      acc: { 'm.sg':'αὐτόν', 'f.sg':'αὐτήν', 'n.sg':'αὐτό',
             'm.pl':'αὐτούς', 'f.pl':'αὐτάς', 'n.pl':'αὐτά' },
      gen: { 'm.sg':'αὐτοῦ', 'f.sg':'αὐτῆς', 'n.sg':'αὐτοῦ',
             'm.pl':'αὐτῶν', 'f.pl':'αὐτῶν', 'n.pl':'αὐτῶν' },
      dat: { 'm.sg':'αὐτῷ', 'f.sg':'αὐτῇ', 'n.sg':'αὐτῷ',
             'm.pl':'αὐτοῖς', 'f.pl':'αὐταῖς', 'n.pl':'αὐτοῖς' }
    }
  },

  pron_houtos: {
    kind: 'adj', label: 'οὗτος (this)', literal: true,
    subtitle: 'οὗτος, αὕτη, τοῦτο — this',
    example: { lemma:'οὗτος, αὕτη, τοῦτο', class:'pron_houtos', meaning:'this' },
    genders: ['m','f','n'],
    categories: ['nom','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { 'm.sg':'οὗτος', 'f.sg':'αὕτη', 'n.sg':'τοῦτο',
             'm.pl':'οὗτοι', 'f.pl':'αὗται', 'n.pl':'ταῦτα' },
      acc: { 'm.sg':'τοῦτον', 'f.sg':'ταύτην', 'n.sg':'τοῦτο',
             'm.pl':'τούτους', 'f.pl':'ταύτας', 'n.pl':'ταῦτα' },
      gen: { 'm.sg':'τούτου', 'f.sg':'ταύτης', 'n.sg':'τούτου',
             'm.pl':'τούτων', 'f.pl':'τούτων', 'n.pl':'τούτων' },
      dat: { 'm.sg':'τούτῳ', 'f.sg':'ταύτῃ', 'n.sg':'τούτῳ',
             'm.pl':'τούτοις', 'f.pl':'ταύταις', 'n.pl':'τούτοις' }
    }
  },

  pron_ekeinos: {
    kind: 'adj', label: 'ἐκεῖνος (that)', literal: true,
    subtitle: 'ἐκεῖνος, ἐκείνη, ἐκεῖνο — that',
    example: { lemma:'ἐκεῖνος, -η, -ο', class:'pron_ekeinos', meaning:'that' },
    genders: ['m','f','n'],
    categories: ['nom','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { 'm.sg':'ἐκεῖνος', 'f.sg':'ἐκείνη', 'n.sg':'ἐκεῖνο',
             'm.pl':'ἐκεῖνοι', 'f.pl':'ἐκεῖναι', 'n.pl':'ἐκεῖνα' },
      acc: { 'm.sg':'ἐκεῖνον', 'f.sg':'ἐκείνην', 'n.sg':'ἐκεῖνο',
             'm.pl':'ἐκείνους', 'f.pl':'ἐκείνας', 'n.pl':'ἐκεῖνα' },
      gen: { 'm.sg':'ἐκείνου', 'f.sg':'ἐκείνης', 'n.sg':'ἐκείνου',
             'm.pl':'ἐκείνων', 'f.pl':'ἐκείνων', 'n.pl':'ἐκείνων' },
      dat: { 'm.sg':'ἐκείνῳ', 'f.sg':'ἐκείνῃ', 'n.sg':'ἐκείνῳ',
             'm.pl':'ἐκείνοις', 'f.pl':'ἐκείναις', 'n.pl':'ἐκείνοις' }
    }
  },

  /* --- second generated tranche: the other core adjective patterns, plus the
     relative and interrogative pronouns. Same pipeline, same hand adjudication.

     TWO-TERMINATION classes (ἀληθής, τίς) declare `genders: ['mf','n']`. The
     masculine and feminine genuinely share one column -- that IS the pattern --
     so carrying a single 'mf' gender prints the table the way the appendix
     prints it, rather than duplicating identical forms into two blocks and
     asking for the same answer twice.

     Dative plurals use Cotidie's movable-nu convention, πᾶσι(ν), as the
     existing third-declension nouns already do; the grader accepts the form
     with or without the nu. --- */
  rel_hos: {
    kind: 'adj', label: 'ὅς (who, which)', literal: true,
    subtitle: 'ὅς, ἥ, ὅ — the relative pronoun',
    example: { lemma:'ὅς, ἥ, ὅ', class:'rel_hos', meaning:'who, which' },
    genders: ['m','f','n'],
    categories: ['nom','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { 'm.sg':'ὅς', 'f.sg':'ἥ', 'n.sg':'ὅ',
             'm.pl':'οἵ', 'f.pl':'αἵ', 'n.pl':'ἅ' },
      acc: { 'm.sg':'ὅν', 'f.sg':'ἥν', 'n.sg':'ὅ',
             'm.pl':'οὕς', 'f.pl':'ἅς', 'n.pl':'ἅ' },
      gen: { 'm.sg':'οὗ', 'f.sg':'ἧς', 'n.sg':'οὗ',
             'm.pl':'ὧν', 'f.pl':'ὧν', 'n.pl':'ὧν' },
      dat: { 'm.sg':'ᾧ', 'f.sg':'ᾗ', 'n.sg':'ᾧ',
             'm.pl':'οἷς', 'f.pl':'αἷς', 'n.pl':'οἷς' }
    }
  },

  adj_os_a_on: {
    kind: 'adj', label: 'Adjectives in -ος, -α, -ον', literal: true,
    subtitle: 'δίκαιος, δικαία, δίκαιον — just (α after ε, ι or ρ)',
    example: { lemma:'δίκαιος, -α, -ον', class:'adj_os_a_on', meaning:'just' },
    genders: ['m','f','n'],
    categories: ['nom','voc','acc','gen','dat', 'comp', 'sup'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { 'm.sg':'δίκαιος', 'f.sg':'δικαία', 'n.sg':'δίκαιον',
             'm.pl':'δίκαιοι', 'f.pl':'δίκαιαι', 'n.pl':'δίκαια' },
      voc: { 'm.sg':'δίκαιε', 'f.sg':'δικαία', 'n.sg':'δίκαιον',
             'm.pl':'δίκαιοι', 'f.pl':'δίκαιαι', 'n.pl':'δίκαια' },
      acc: { 'm.sg':'δίκαιον', 'f.sg':'δικαίαν', 'n.sg':'δίκαιον',
             'm.pl':'δικαίους', 'f.pl':'δικαίας', 'n.pl':'δίκαια' },
      gen: { 'm.sg':'δικαίου', 'f.sg':'δικαίας', 'n.sg':'δικαίου',
             'm.pl':'δικαίων', 'f.pl':'δικαίων', 'n.pl':'δικαίων' },
      dat: { 'm.sg':'δικαίῳ', 'f.sg':'δικαίᾳ', 'n.sg':'δικαίῳ',
             'm.pl':'δικαίοις', 'f.pl':'δικαίαις', 'n.pl':'δικαίοις' },
      // Comparative and superlative. Every adjective table in the appendix
      // carries these two rows and the deck had not one of them, which made
      // comparison the single most examinable thing missing (pp.327-329).
      // Only the nominative singular is printed, so only that is drilled:
      // the comparative declines like a 2-1-2 adjective, but deriving its
      // other cells means deriving accents, which this file does not do.
      // Two-termination adjectives are printed masculine and feminine
      // together (ἀληθέστερος, ἀληθεστέρα); both are accepted.
      comp: { 'm.sg':'δικαιότερος', 'f.sg':'δικαιοτέρα', 'n.sg':'δικαιότερον' },
      sup:  { 'm.sg':'δικαιότατος', 'f.sg':'δικαιοτάτη', 'n.sg':'δικαιότατον' }
    }
  },

  adj_pas: {
    kind: 'adj', label: 'πᾶς (all, every)', literal: true,
    subtitle: 'πᾶς, πᾶσα, πᾶν — all, every, whole',
    example: { lemma:'πᾶς, πᾶσα, πᾶν', class:'adj_pas', meaning:'all, every' },
    genders: ['m','f','n'],
    categories: ['nom','voc','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { 'm.sg':'πᾶς', 'f.sg':'πᾶσα', 'n.sg':'πᾶν',
             'm.pl':'πάντες', 'f.pl':'πᾶσαι', 'n.pl':'πάντα' },
      voc: { 'm.sg':'πᾶς', 'f.sg':'πᾶσα', 'n.sg':'πᾶν',
             'm.pl':'πάντες', 'f.pl':'πᾶσαι', 'n.pl':'πάντα' },
      acc: { 'm.sg':'πάντα', 'f.sg':'πᾶσαν', 'n.sg':'πᾶν',
             'm.pl':'πάντας', 'f.pl':'πάσας', 'n.pl':'πάντα' },
      gen: { 'm.sg':'παντός', 'f.sg':'πάσης', 'n.sg':'παντός',
             'm.pl':'πάντων', 'f.pl':'πασῶν', 'n.pl':'πάντων' },
      dat: { 'm.sg':'παντί', 'f.sg':'πάσῃ', 'n.sg':'παντί',
             'm.pl':'πᾶσι(ν)', 'f.pl':'πάσαις', 'n.pl':'πᾶσι(ν)' }
    }
  },

  adj_hs_es: {
    kind: 'adj', label: 'Adjectives in -ης, -ες', literal: true,
    subtitle: 'ἀληθής, ἀληθές — true (third declension, two terminations)',
    example: { lemma:'ἀληθής, -ές', class:'adj_hs_es', meaning:'true' },
    genders: ['mf','n'],
    categories: ['nom','voc','acc','gen','dat', 'comp', 'sup'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { 'mf.sg':'ἀληθής', 'n.sg':'ἀληθές', 'mf.pl':'ἀληθεῖς', 'n.pl':'ἀληθῆ' },
      voc: { 'mf.sg':'ἀληθές', 'n.sg':'ἀληθές', 'mf.pl':'ἀληθεῖς', 'n.pl':'ἀληθῆ' },
      acc: { 'mf.sg':'ἀληθῆ',  'n.sg':'ἀληθές', 'mf.pl':'ἀληθεῖς', 'n.pl':'ἀληθῆ' },
      gen: { 'mf.sg':'ἀληθοῦς','n.sg':'ἀληθοῦς','mf.pl':'ἀληθῶν',  'n.pl':'ἀληθῶν' },
      dat: { 'mf.sg':'ἀληθεῖ', 'n.sg':'ἀληθεῖ', 'mf.pl':'ἀληθέσι(ν)', 'n.pl':'ἀληθέσι(ν)' },
      // Comparative and superlative. Every adjective table in the appendix
      // carries these two rows and the deck had not one of them, which made
      // comparison the single most examinable thing missing (pp.327-329).
      // Only the nominative singular is printed, so only that is drilled:
      // the comparative declines like a 2-1-2 adjective, but deriving its
      // other cells means deriving accents, which this file does not do.
      // Two-termination adjectives are printed masculine and feminine
      // together (ἀληθέστερος, ἀληθεστέρα); both are accepted.
      comp: { 'mf.sg':['ἀληθέστερος','ἀληθεστέρα'], 'n.sg':'ἀληθέστερον' },
      sup:  { 'mf.sg':['ἀληθέστατος','ἀληθεστάτη'], 'n.sg':'ἀληθέστατον' }
    }
  },

  pron_tis: {
    kind: 'adj', label: 'τίς (who? what?)', literal: true,
    subtitle: 'τίς, τί — the interrogative pronoun',
    example: { lemma:'τίς, τί', class:'pron_tis', meaning:'who? what? which?' },
    genders: ['mf','n'],
    categories: ['nom','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { 'mf.sg':'τίς',   'n.sg':'τί',    'mf.pl':'τίνες', 'n.pl':'τίνα' },
      acc: { 'mf.sg':'τίνα',  'n.sg':'τί',    'mf.pl':'τίνας', 'n.pl':'τίνα' },
      gen: { 'mf.sg':['τίνος','τοῦ'], 'n.sg':['τίνος','τοῦ'], 'mf.pl':'τίνων', 'n.pl':'τίνων' },
      dat: { 'mf.sg':['τίνι','τῷ'],  'n.sg':['τίνι','τῷ'],  'mf.pl':'τίσι(ν)', 'n.pl':'τίσι(ν)' }
    }
  },


  /* --- third generated tranche: the noun classes the deck was thinnest on.
     Same pipeline (tools/verify/gen_greek_decl.py), same hand adjudication.
     Dative plurals carry the movable nu in Cotidie's usual bracket form. --- */

  // -ᾱ after ε, ι or ρ: the genitive and dative singular keep the alpha
  // where τιμή has eta.
  decl1_a_long: {
    kind: 'noun', label: '1st Declension (ᾱ-stem, feminine)', literal: true,
    subtitle: 'χώρα, χώρας, ἡ — land, country',
    example: { lemma:'χώρα', class:'decl1_a_long', gender:'f', meaning:'land, country' },
    categories: ['nom','voc','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { sg:'χώρα',          pl:'χῶραι' },
      voc: { sg:'χώρα',          pl:'χῶραι' },
      acc: { sg:'χώραν',         pl:'χώρας' },
      gen: { sg:'χώρας',         pl:'χωρῶν' },
      dat: { sg:'χώρᾳ',          pl:'χώραις' }
    }
  },

  // short alpha in the nominative, but eta in the genitive and dative
  // singular -- the mixed pattern.
  decl1_a_short: {
    kind: 'noun', label: '1st Declension (ᾰ-stem, feminine)', literal: true,
    subtitle: 'θάλαττα, θαλάττης, ἡ — sea',
    example: { lemma:'θάλαττα', class:'decl1_a_short', gender:'f', meaning:'sea' },
    categories: ['nom','voc','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { sg:'θάλαττα',       pl:'θάλατται' },
      voc: { sg:'θάλαττα',       pl:'θάλατται' },
      acc: { sg:'θάλατταν',      pl:'θαλάττας' },
      gen: { sg:'θαλάττης',      pl:'θαλαττῶν' },
      dat: { sg:'θαλάττῃ',       pl:'θαλάτταις' }
    }
  },

  decl1_as: {
    kind: 'noun', label: '1st Declension (masculine in -ᾱς)', literal: true,
    subtitle: 'νεανίας, νεανίου, ὁ — young man',
    example: { lemma:'νεανίας', class:'decl1_as', gender:'m', meaning:'young man' },
    categories: ['nom','voc','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { sg:'νεανίας',       pl:'νεανίαι' },
      voc: { sg:'νεανία',        pl:'νεανίαι' },
      acc: { sg:'νεανίαν',       pl:'νεανίας' },
      gen: { sg:'νεανίου',       pl:'νεανιῶν' },
      dat: { sg:'νεανίᾳ',        pl:'νεανίαις' }
    }
  },

  decl3_is: {
    kind: 'noun', label: '3rd Declension (-ις, -εως)', literal: true,
    subtitle: 'πόλις, πόλεως, ἡ — city',
    example: { lemma:'πόλις', class:'decl3_is', gender:'f', meaning:'city' },
    categories: ['nom','voc','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { sg:'πόλις',         pl:'πόλεις' },
      voc: { sg:'πόλι',          pl:'πόλεις' },
      acc: { sg:'πόλιν',         pl:'πόλεις' },
      gen: { sg:'πόλεως',        pl:'πόλεων' },
      dat: { sg:'πόλει',         pl:'πόλεσι(ν)' }
    }
  },

  // The nominative and vocative plural have two Attic forms, βασιλῆς
  // (older) and βασιλεῖς (later, and what most modern textbooks print).
  // Both are stored, so the table shows the first and either is accepted.
  decl3_eus: {
    kind: 'noun', label: '3rd Declension (-ευς, -εως)', literal: true,
    subtitle: 'βασιλεύς, βασιλέως, ὁ — king',
    example: { lemma:'βασιλεύς', class:'decl3_eus', gender:'m', meaning:'king' },
    categories: ['nom','voc','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { sg:'βασιλεύς',      pl:['βασιλῆς','βασιλεῖς'] },
      voc: { sg:'βασιλεῦ',       pl:['βασιλῆς','βασιλεῖς'] },
      acc: { sg:'βασιλέα',       pl:'βασιλέας' },
      gen: { sg:'βασιλέως',      pl:'βασιλέων' },
      dat: { sg:'βασιλεῖ',       pl:'βασιλεῦσι(ν)' }
    }
  },

  decl3_os_n: {
    kind: 'noun', label: '3rd Declension (-ος, -ους, neuter)', literal: true,
    subtitle: 'γένος, γένους, τό — race, kind',
    example: { lemma:'γένος', class:'decl3_os_n', gender:'n', meaning:'race, kind' },
    categories: ['nom','voc','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { sg:'γένος',         pl:'γένη' },
      voc: { sg:'γένος',         pl:'γένη' },
      acc: { sg:'γένος',         pl:'γένη' },
      gen: { sg:'γένους',        pl:'γενῶν' },
      dat: { sg:'γένει',         pl:'γένεσι(ν)' }
    }
  },

  // The vocative singular shortens the stem vowel: ῥῆτορ, not ῥήτωρ.
  decl3_wr: {
    kind: 'noun', label: '3rd Declension (-ωρ, -ορος)', literal: true,
    subtitle: 'ῥήτωρ, ῥήτορος, ὁ — orator',
    example: { lemma:'ῥήτωρ', class:'decl3_wr', gender:'m', meaning:'orator, speaker' },
    categories: ['nom','voc','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { sg:'ῥήτωρ',         pl:'ῥήτορες' },
      voc: { sg:'ῥῆτορ',         pl:'ῥήτορες' },
      acc: { sg:'ῥήτορα',        pl:'ῥήτορας' },
      gen: { sg:'ῥήτορος',       pl:'ῥητόρων' },
      dat: { sg:'ῥήτορι',        pl:'ῥήτορσι(ν)' }
    }
  },

  // Genuinely irregular -- the stem alternates ναυ- / νη- / νε-.
  decl3_naus: {
    kind: 'noun', label: 'ναῦς (irregular)', literal: true,
    subtitle: 'ναῦς, νεώς, ἡ — ship',
    example: { lemma:'ναῦς', class:'decl3_naus', gender:'f', meaning:'ship' },
    categories: ['nom','voc','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { sg:'ναῦς',          pl:'νῆες' },
      voc: { sg:'ναῦ',           pl:'νῆες' },
      acc: { sg:'ναῦν',          pl:'ναῦς' },
      gen: { sg:'νεώς',          pl:'νεῶν' },
      dat: { sg:'νηΐ',           pl:'ναυσί(ν)' }
    }
  },


  /* --- fourth generated tranche: the three contract verbs.

     A contract verb's whole difficulty is in the present and imperfect, where
     the stem vowel contracts with the ending: τιμάω is never written τιμάω in
     Attic, it is τιμῶ. Wiktionary renders BOTH tables for these -- the
     uncontracted forms first, to show what is contracting, and the real forms
     second -- so the generator takes the LAST table. Taking the first would
     have shipped τιμάω, τιμάεις, τιμάει as the answers, which is precisely
     the thing a learner must not be taught backwards.

     The three differ in how many tense systems Wiktionary attests, so each
     class declares the categories it actually has rather than being padded to
     a uniform set. That is the ragged-paradigm work earning its keep again. --- */

  contract_aw: {
    kind: 'verb', label: 'Contract verbs in -άω', literal: true,
    subtitle: 'τιμάω → τιμῶ — to honour',
    example: { lemma:'τιμάω', class:'contract_aw', meaning:'to honour' },
    categories: ['pres.act', 'pres.mp', 'impf.act', 'impf.mp', 'fut.act', 'fut.mid', 'fut.pass', 'aor.act', 'aor.mid', 'aor.pass', 'perf.act', 'perf.mp', 'plup.act', 'plup.mp', 'pres.act.subj', 'pres.act.opt', 'pres.act.imper', 'pres.mp.subj', 'pres.mp.opt', 'pres.mp.imper', 'fut.act.opt', 'fut.mid.opt', 'fut.pass.opt', 'aor.act.subj', 'aor.act.opt', 'aor.act.imper', 'aor.mid.subj', 'aor.mid.opt', 'aor.mid.imper', 'aor.pass.subj', 'aor.pass.opt', 'aor.pass.imper', 'pres.act.inf', 'pres.mp.inf', 'fut.act.inf', 'fut.mid.inf', 'fut.pass.inf', 'aor.act.inf', 'aor.mid.inf', 'aor.pass.inf', 'perf.act.inf', 'perf.mp.inf'],
    cellKeys: ['1sg','2sg','3sg','1pl','2pl','3pl'],
    endings: {
      'pres.act': { '1sg':'τιμῶ', '2sg':'τιμᾷς', '3sg':'τιμᾷ', '1pl':'τιμῶμεν', '2pl':'τιμᾶτε', '3pl':'τιμῶσι(ν)' },
      'pres.mp': { '1sg':'τιμῶμαι', '2sg':'τιμᾷ', '3sg':'τιμᾶται', '1pl':'τιμώμεθα', '2pl':'τιμᾶσθε', '3pl':'τιμῶνται' },
      'impf.act': { '1sg':'ἐτίμων', '2sg':'ἐτίμας', '3sg':'ἐτίμα', '1pl':'ἐτιμῶμεν', '2pl':'ἐτιμᾶτε', '3pl':'ἐτίμων' },
      'impf.mp': { '1sg':'ἐτιμώμην', '2sg':'ἐτιμῶ', '3sg':'ἐτιμᾶτο', '1pl':'ἐτιμώμεθα', '2pl':'ἐτιμᾶσθε', '3pl':'ἐτιμῶντο' },
      'fut.act': { '1sg':'τιμήσω', '2sg':'τιμήσεις', '3sg':'τιμήσει', '1pl':'τιμήσομεν', '2pl':'τιμήσετε', '3pl':'τιμήσουσι(ν)' },
      'fut.mid': { '1sg':'τιμήσομαι', '2sg':['τιμήσῃ','τιμήσει'], '3sg':'τιμήσεται', '1pl':'τιμησόμεθα', '2pl':'τιμήσεσθε', '3pl':'τιμήσονται' },
      'fut.pass': { '1sg':'τιμηθήσομαι', '2sg':['τιμηθήσῃ','τιμηθήσει'], '3sg':'τιμηθήσεται', '1pl':'τιμηθησόμεθα', '2pl':'τιμηθήσεσθε', '3pl':'τιμηθήσονται' },
      'aor.act': { '1sg':'ἐτίμησα', '2sg':'ἐτίμησας', '3sg':'ἐτίμησε(ν)', '1pl':'ἐτιμήσαμεν', '2pl':'ἐτιμήσατε', '3pl':'ἐτίμησαν' },
      'aor.mid': { '1sg':'ἐτιμησάμην', '2sg':'ἐτιμήσω', '3sg':'ἐτιμήσατο', '1pl':'ἐτιμησάμεθα', '2pl':'ἐτιμήσασθε', '3pl':'ἐτιμήσαντο' },
      'aor.pass': { '1sg':'ἐτιμήθην', '2sg':'ἐτιμήθης', '3sg':'ἐτιμήθη', '1pl':'ἐτιμήθημεν', '2pl':'ἐτιμήθητε', '3pl':'ἐτιμήθησαν' },
      'perf.act': { '1sg':'τετίμηκα', '2sg':'τετίμηκας', '3sg':'τετίμηκε(ν)', '1pl':'τετιμήκαμεν', '2pl':'τετιμήκατε', '3pl':'τετιμήκασι(ν)' },
      'perf.mp': { '1sg':'τετίμημαι', '2sg':'τετίμησαι', '3sg':'τετίμηται', '1pl':'τετιμήμεθα', '2pl':'τετίμησθε', '3pl':'τετίμηνται' },
      'plup.act': { '1sg':['ἐτετιμήκειν','ἐτετιμήκη'], '2sg':['ἐτετιμήκεις','ἐτετιμήκης'], '3sg':'ἐτετιμήκει(ν)', '1pl':'ἐτετιμήκεμεν', '2pl':'ἐτετιμήκετε', '3pl':'ἐτετιμήκεσαν' },
      'plup.mp': { '1sg':'ἐτετιμήμην', '2sg':'ἐτετίμησο', '3sg':'ἐτετίμητο', '1pl':'ἐτετιμήμεθα', '2pl':'ἐτετίμησθε', '3pl':'ἐτετίμηντο' },

      /* ---- the non-indicative moods and the infinitives ----
         The subjunctive of an -άω verb is spelt exactly like its indicative:
         τιμάω/τιμάῃς contract to τιμῶ/τιμᾷς either way. That is a real fact
         about the contraction, not a duplicated block. ---- */
      'pres.act.subj': { '1sg':'τιμῶ', '2sg':'τιμᾷς', '3sg':'τιμᾷ', '1pl':'τιμῶμεν', '2pl':'τιμᾶτε', '3pl':'τιμῶσι(ν)' },
      'pres.act.opt': { '1sg':['τιμῴην','τιμῷμι'], '2sg':['τιμῴης','τιμῷς'], '3sg':['τιμῴη','τιμῷ'], '1pl':['τιμῷμεν','τιμῴημεν'], '2pl':['τιμῷτε','τιμῴητε'], '3pl':['τιμῷεν','τιμῴησαν'] },
      'pres.act.imper': { '2sg':'τίμα', '3sg':'τιμάτω', '2pl':'τιμᾶτε', '3pl':'τιμώντων' },
      'pres.mp.subj': { '1sg':'τιμῶμαι', '2sg':'τιμᾷ', '3sg':'τιμᾶται', '1pl':'τιμώμεθα', '2pl':'τιμᾶσθε', '3pl':'τιμῶνται' },
      'pres.mp.opt': { '1sg':'τιμῴμην', '2sg':'τιμῷο', '3sg':'τιμῷτο', '1pl':'τιμῴμεθα', '2pl':'τιμῷσθε', '3pl':'τιμῷντο' },
      'pres.mp.imper': { '2sg':'τιμῶ', '3sg':'τιμάσθω', '2pl':'τιμᾶσθε', '3pl':'τιμάσθων' },
      'fut.act.opt': { '1sg':'τιμήσοιμι', '2sg':'τιμήσοις', '3sg':'τιμήσοι', '1pl':'τιμήσοιμεν', '2pl':'τιμήσοιτε', '3pl':'τιμήσοιεν' },
      'fut.mid.opt': { '1sg':'τιμησοίμην', '2sg':'τιμήσοιο', '3sg':'τιμήσοιτο', '1pl':'τιμησοίμεθα', '2pl':'τιμήσοισθε', '3pl':'τιμήσοιντο' },
      'fut.pass.opt': { '1sg':'τιμηθησοίμην', '2sg':'τιμηθήσοιο', '3sg':'τιμηθήσοιτο', '1pl':'τιμηθησοίμεθα', '2pl':'τιμηθήσοισθε', '3pl':'τιμηθήσοιντο' },
      'aor.act.subj': { '1sg':'τιμήσω', '2sg':'τιμήσῃς', '3sg':'τιμήσῃ', '1pl':'τιμήσωμεν', '2pl':'τιμήσητε', '3pl':'τιμήσωσι(ν)' },
      'aor.act.opt': { '1sg':'τιμήσαιμι', '2sg':['τιμήσειας','τιμήσαις'], '3sg':['τιμήσειε(ν)','τιμήσαι'], '1pl':'τιμήσαιμεν', '2pl':'τιμήσαιτε', '3pl':['τιμήσειαν','τιμήσαιεν'] },
      'aor.act.imper': { '2sg':'τίμησον', '3sg':'τιμησάτω', '2pl':'τιμήσατε', '3pl':'τιμησάντων' },
      'aor.mid.subj': { '1sg':'τιμήσωμαι', '2sg':'τιμήσῃ', '3sg':'τιμήσηται', '1pl':'τιμησώμεθα', '2pl':'τιμήσησθε', '3pl':'τιμήσωνται' },
      'aor.mid.opt': { '1sg':'τιμησαίμην', '2sg':'τιμήσαιο', '3sg':'τιμήσαιτο', '1pl':'τιμησαίμεθα', '2pl':'τιμήσαισθε', '3pl':'τιμήσαιντο' },
      'aor.mid.imper': { '2sg':'τίμησαι', '3sg':'τιμησάσθω', '2pl':'τιμήσασθε', '3pl':'τιμησάσθων' },
      'aor.pass.subj': { '1sg':'τιμηθῶ', '2sg':'τιμηθῇς', '3sg':'τιμηθῇ', '1pl':'τιμηθῶμεν', '2pl':'τιμηθῆτε', '3pl':'τιμηθῶσι(ν)' },
      'aor.pass.opt': { '1sg':'τιμηθείην', '2sg':'τιμηθείης', '3sg':'τιμηθείη', '1pl':['τιμηθεῖμεν','τιμηθείημεν'], '2pl':['τιμηθεῖτε','τιμηθείητε'], '3pl':['τιμηθεῖεν','τιμηθείησαν'] },
      'aor.pass.imper': { '2sg':'τιμήθητι', '3sg':'τιμηθήτω', '2pl':'τιμήθητε', '3pl':'τιμηθέντων' },
      'pres.act.inf': { inf:'τιμᾶν' },
      'pres.mp.inf': { inf:'τιμᾶσθαι' },
      'fut.act.inf': { inf:'τιμήσειν' },
      'fut.mid.inf': { inf:'τιμήσεσθαι' },
      'fut.pass.inf': { inf:'τιμηθήσεσθαι' },
      'aor.act.inf': { inf:'τιμῆσαι' },
      'aor.mid.inf': { inf:'τιμήσασθαι' },
      'aor.pass.inf': { inf:'τιμηθῆναι' },
      'perf.act.inf': { inf:'τετιμηκέναι' },
      'perf.mp.inf': { inf:'τετιμῆσθαι' }
    }
  },

  contract_ew: {
    kind: 'verb', label: 'Contract verbs in -έω', literal: true,
    subtitle: 'ποιέω → ποιῶ — to do, make',
    example: { lemma:'ποιέω', class:'contract_ew', meaning:'to do, make' },
    categories: ['pres.act', 'pres.mp', 'impf.act', 'impf.mp', 'fut.act', 'fut.mid', 'fut.pass', 'aor.act', 'aor.mid', 'aor.pass', 'perf.act', 'perf.mp', 'plup.act', 'plup.mp', 'pres.act.subj', 'pres.act.opt', 'pres.act.imper', 'pres.mp.subj', 'pres.mp.opt', 'pres.mp.imper', 'fut.act.opt', 'fut.mid.opt', 'fut.pass.opt', 'aor.act.subj', 'aor.act.opt', 'aor.act.imper', 'aor.mid.subj', 'aor.mid.opt', 'aor.mid.imper', 'aor.pass.subj', 'aor.pass.opt', 'aor.pass.imper', 'pres.act.inf', 'pres.mp.inf', 'fut.act.inf', 'fut.mid.inf', 'fut.pass.inf', 'aor.act.inf', 'aor.mid.inf', 'aor.pass.inf', 'perf.act.inf', 'perf.mp.inf'],
    cellKeys: ['1sg','2sg','3sg','1pl','2pl','3pl'],
    endings: {
      'pres.act': { '1sg':'ποιῶ', '2sg':'ποιεῖς', '3sg':'ποιεῖ', '1pl':'ποιοῦμεν', '2pl':'ποιεῖτε', '3pl':'ποιοῦσι(ν)' },
      'pres.mp': { '1sg':'ποιοῦμαι', '2sg':['ποιεῖ','ποιῇ'], '3sg':'ποιεῖται', '1pl':'ποιούμεθα', '2pl':'ποιεῖσθε', '3pl':'ποιοῦνται' },
      'impf.act': { '1sg':'ἐποίουν', '2sg':'ἐποίεις', '3sg':'ἐποίει', '1pl':'ἐποιοῦμεν', '2pl':'ἐποιεῖτε', '3pl':'ἐποίουν' },
      'impf.mp': { '1sg':'ἐποιούμην', '2sg':'ἐποιοῦ', '3sg':'ἐποιεῖτο', '1pl':'ἐποιούμεθα', '2pl':'ἐποιεῖσθε', '3pl':'ἐποιοῦντο' },
      'fut.act': { '1sg':'ποιήσω', '2sg':'ποιήσεις', '3sg':'ποιήσει', '1pl':'ποιήσομεν', '2pl':'ποιήσετε', '3pl':'ποιήσουσι(ν)' },
      'fut.mid': { '1sg':'ποιήσομαι', '2sg':['ποιήσῃ','ποιήσει'], '3sg':'ποιήσεται', '1pl':'ποιησόμεθα', '2pl':'ποιήσεσθε', '3pl':'ποιήσονται' },
      'fut.pass': { '1sg':'ποιηθήσομαι', '2sg':['ποιηθήσῃ','ποιηθήσει'], '3sg':'ποιηθήσεται', '1pl':'ποιηθησόμεθα', '2pl':'ποιηθήσεσθε', '3pl':'ποιηθήσονται' },
      'aor.act': { '1sg':'ἐποίησα', '2sg':'ἐποίησας', '3sg':'ἐποίησε(ν)', '1pl':'ἐποιήσαμεν', '2pl':'ἐποιήσατε', '3pl':'ἐποίησαν' },
      'aor.mid': { '1sg':'ἐποιησάμην', '2sg':'ἐποιήσω', '3sg':'ἐποιήσατο', '1pl':'ἐποιησάμεθα', '2pl':'ἐποιήσασθε', '3pl':'ἐποιήσαντο' },
      'aor.pass': { '1sg':'ἐποιήθην', '2sg':'ἐποιήθης', '3sg':'ἐποιήθη', '1pl':'ἐποιήθημεν', '2pl':'ἐποιήθητε', '3pl':'ἐποιήθησαν' },
      'perf.act': { '1sg':'πεποίηκα', '2sg':'πεποίηκας', '3sg':'πεποίηκε(ν)', '1pl':'πεποιήκαμεν', '2pl':'πεποιήκατε', '3pl':'πεποιήκασι(ν)' },
      'perf.mp': { '1sg':'πεποίημαι', '2sg':'πεποίησαι', '3sg':'πεποίηται', '1pl':'πεποιήμεθα', '2pl':'πεποίησθε', '3pl':'πεποίηνται' },
      'plup.act': { '1sg':['ἐπεποιήκειν','ἐπεποιήκη'], '2sg':['ἐπεποιήκεις','ἐπεποιήκης'], '3sg':'ἐπεποιήκει(ν)', '1pl':'ἐπεποιήκεμεν', '2pl':'ἐπεποιήκετε', '3pl':'ἐπεποιήκεσαν' },
      'plup.mp': { '1sg':'ἐπεποιήμην', '2sg':'ἐπεποίησο', '3sg':'ἐπεποίητο', '1pl':'ἐπεποιήμεθα', '2pl':'ἐπεποίησθε', '3pl':'ἐπεποίηντο' },

      /* ---- the non-indicative moods and the infinitives ----
         ε contracts to a different vowel in nearly every ending, so unlike
         τιμάω the subjunctive here is visibly distinct from the indicative:
         ποιεῖς but ποιῇς. No future perfect, as the indicative has none. ---- */
      'pres.act.subj': { '1sg':'ποιῶ', '2sg':'ποιῇς', '3sg':'ποιῇ', '1pl':'ποιῶμεν', '2pl':'ποιῆτε', '3pl':'ποιῶσι(ν)' },
      'pres.act.opt': { '1sg':['ποιοίην','ποιοῖμι'], '2sg':['ποιοίης','ποιοῖς'], '3sg':['ποιοίη','ποιοῖ'], '1pl':['ποιοῖμεν','ποιοίημεν'], '2pl':['ποιοῖτε','ποιοίητε'], '3pl':['ποιοῖεν','ποιοίησαν'] },
      'pres.act.imper': { '2sg':'ποίει', '3sg':'ποιείτω', '2pl':'ποιεῖτε', '3pl':'ποιούντων' },
      'pres.mp.subj': { '1sg':'ποιῶμαι', '2sg':'ποιῇ', '3sg':'ποιῆται', '1pl':'ποιώμεθα', '2pl':'ποιῆσθε', '3pl':'ποιῶνται' },
      'pres.mp.opt': { '1sg':'ποιοίμην', '2sg':'ποιοῖο', '3sg':'ποιοῖτο', '1pl':'ποιοίμεθα', '2pl':'ποιοῖσθε', '3pl':'ποιοῖντο' },
      'pres.mp.imper': { '2sg':'ποιοῦ', '3sg':'ποιείσθω', '2pl':'ποιεῖσθε', '3pl':'ποιείσθων' },
      'fut.act.opt': { '1sg':'ποιήσοιμι', '2sg':'ποιήσοις', '3sg':'ποιήσοι', '1pl':'ποιήσοιμεν', '2pl':'ποιήσοιτε', '3pl':'ποιήσοιεν' },
      'fut.mid.opt': { '1sg':'ποιησοίμην', '2sg':'ποιήσοιο', '3sg':'ποιήσοιτο', '1pl':'ποιησοίμεθα', '2pl':'ποιήσοισθε', '3pl':'ποιήσοιντο' },
      'fut.pass.opt': { '1sg':'ποιηθησοίμην', '2sg':'ποιηθήσοιο', '3sg':'ποιηθήσοιτο', '1pl':'ποιηθησοίμεθα', '2pl':'ποιηθήσοισθε', '3pl':'ποιηθήσοιντο' },
      'aor.act.subj': { '1sg':'ποιήσω', '2sg':'ποιήσῃς', '3sg':'ποιήσῃ', '1pl':'ποιήσωμεν', '2pl':'ποιήσητε', '3pl':'ποιήσωσι(ν)' },
      'aor.act.opt': { '1sg':'ποιήσαιμι', '2sg':['ποιήσειας','ποιήσαις'], '3sg':['ποιήσειε(ν)','ποιήσαι'], '1pl':'ποιήσαιμεν', '2pl':'ποιήσαιτε', '3pl':['ποιήσειαν','ποιήσαιεν'] },
      'aor.act.imper': { '2sg':'ποίησον', '3sg':'ποιησάτω', '2pl':'ποιήσατε', '3pl':'ποιησάντων' },
      'aor.mid.subj': { '1sg':'ποιήσωμαι', '2sg':'ποιήσῃ', '3sg':'ποιήσηται', '1pl':'ποιησώμεθα', '2pl':'ποιήσησθε', '3pl':'ποιήσωνται' },
      'aor.mid.opt': { '1sg':'ποιησαίμην', '2sg':'ποιήσαιο', '3sg':'ποιήσαιτο', '1pl':'ποιησαίμεθα', '2pl':'ποιήσαισθε', '3pl':'ποιήσαιντο' },
      'aor.mid.imper': { '2sg':'ποίησαι', '3sg':'ποιησάσθω', '2pl':'ποιήσασθε', '3pl':'ποιησάσθων' },
      'aor.pass.subj': { '1sg':'ποιηθῶ', '2sg':'ποιηθῇς', '3sg':'ποιηθῇ', '1pl':'ποιηθῶμεν', '2pl':'ποιηθῆτε', '3pl':'ποιηθῶσι(ν)' },
      'aor.pass.opt': { '1sg':'ποιηθείην', '2sg':'ποιηθείης', '3sg':'ποιηθείη', '1pl':['ποιηθεῖμεν','ποιηθείημεν'], '2pl':['ποιηθεῖτε','ποιηθείητε'], '3pl':['ποιηθεῖεν','ποιηθείησαν'] },
      'aor.pass.imper': { '2sg':'ποιήθητι', '3sg':'ποιηθήτω', '2pl':'ποιήθητε', '3pl':'ποιηθέντων' },
      'pres.act.inf': { inf:'ποιεῖν' },
      'pres.mp.inf': { inf:'ποιεῖσθαι' },
      'fut.act.inf': { inf:'ποιήσειν' },
      'fut.mid.inf': { inf:'ποιήσεσθαι' },
      'fut.pass.inf': { inf:'ποιηθήσεσθαι' },
      'aor.act.inf': { inf:'ποιῆσαι' },
      'aor.mid.inf': { inf:'ποιήσασθαι' },
      'aor.pass.inf': { inf:'ποιηθῆναι' },
      'perf.act.inf': { inf:'πεποιηκέναι' },
      'perf.mp.inf': { inf:'πεποιῆσθαι' }
    }
  },

  contract_ow: {
    kind: 'verb', label: 'Contract verbs in -όω', literal: true,
    subtitle: 'δηλόω → δηλῶ — to show, make clear',
    example: { lemma:'δηλόω', class:'contract_ow', meaning:'to show, make clear' },
    categories: ['pres.act', 'pres.mp', 'impf.act', 'impf.mp', 'fut.act', 'fut.mid', 'fut.pass', 'aor.act', 'aor.mid', 'aor.pass', 'perf.act', 'perf.mp', 'plup.act', 'plup.mp', 'pres.act.subj', 'pres.act.opt', 'pres.act.imper', 'pres.mp.subj', 'pres.mp.opt', 'pres.mp.imper', 'fut.act.opt', 'fut.mid.opt', 'fut.pass.opt', 'aor.act.subj', 'aor.act.opt', 'aor.act.imper', 'aor.mid.subj', 'aor.mid.opt', 'aor.mid.imper', 'aor.pass.subj', 'aor.pass.opt', 'aor.pass.imper', 'pres.act.inf', 'pres.mp.inf', 'fut.act.inf', 'fut.mid.inf', 'fut.pass.inf', 'aor.act.inf', 'aor.mid.inf', 'aor.pass.inf', 'perf.act.inf', 'perf.mp.inf'],
    cellKeys: ['1sg','2sg','3sg','1pl','2pl','3pl'],
    endings: {
      'pres.act': { '1sg':'δηλῶ', '2sg':'δηλοῖς', '3sg':'δηλοῖ', '1pl':'δηλοῦμεν', '2pl':'δηλοῦτε', '3pl':'δηλοῦσι(ν)' },
      'pres.mp': { '1sg':'δηλοῦμαι', '2sg':'δηλοῖ', '3sg':'δηλοῦται', '1pl':'δηλούμεθα', '2pl':'δηλοῦσθε', '3pl':'δηλοῦνται' },
      'impf.act': { '1sg':'ἐδήλουν', '2sg':'ἐδήλους', '3sg':'ἐδήλου', '1pl':'ἐδηλοῦμεν', '2pl':'ἐδηλοῦτε', '3pl':'ἐδήλουν' },
      'impf.mp': { '1sg':'ἐδηλούμην', '2sg':'ἐδηλοῦ', '3sg':'ἐδηλοῦτο', '1pl':'ἐδηλούμεθα', '2pl':'ἐδηλοῦσθε', '3pl':'ἐδηλοῦντο' },
      'fut.act': { '1sg':'δηλώσω', '2sg':'δηλώσεις', '3sg':'δηλώσει', '1pl':'δηλώσομεν', '2pl':'δηλώσετε', '3pl':'δηλώσουσι(ν)' },
      'fut.mid': { '1sg':'δηλώσομαι', '2sg':['δηλώσῃ','δηλώσει'], '3sg':'δηλώσεται', '1pl':'δηλωσόμεθα', '2pl':'δηλώσεσθε', '3pl':'δηλώσονται' },
      'fut.pass': { '1sg':'δηλωθήσομαι', '2sg':['δηλωθήσῃ','δηλωθήσει'], '3sg':'δηλωθήσεται', '1pl':'δηλωθησόμεθα', '2pl':'δηλωθήσεσθε', '3pl':'δηλωθήσονται' },
      'aor.act': { '1sg':'ἐδήλωσα', '2sg':'ἐδήλωσας', '3sg':'ἐδήλωσε(ν)', '1pl':'ἐδηλώσαμεν', '2pl':'ἐδηλώσατε', '3pl':'ἐδήλωσαν' },
      'aor.mid': { '1sg':'ἐδηλωσάμην', '2sg':'ἐδηλώσω', '3sg':'ἐδηλώσατο', '1pl':'ἐδηλωσάμεθα', '2pl':'ἐδηλώσασθε', '3pl':'ἐδηλώσαντο' },
      'aor.pass': { '1sg':'ἐδηλώθην', '2sg':'ἐδηλώθης', '3sg':'ἐδηλώθη', '1pl':'ἐδηλώθημεν', '2pl':'ἐδηλώθητε', '3pl':'ἐδηλώθησαν' },
      'perf.act': { '1sg':'δεδήλωκα', '2sg':'δεδήλωκας', '3sg':'δεδήλωκε(ν)', '1pl':'δεδηλώκαμεν', '2pl':'δεδηλώκατε', '3pl':'δεδηλώκασι(ν)' },
      'perf.mp': { '1sg':'δεδήλωμαι', '2sg':'δεδήλωσαι', '3sg':'δεδήλωται', '1pl':'δεδηλώμεθα', '2pl':'δεδήλωσθε', '3pl':'δεδήλωνται' },
      /* No pluperfect at all until 2026-08-23, while τιμάω and ποιέω both had
         one -- so p.338's ἐδεδηλώκη and p.340's ἐδεδηλώμην, printed in the same
         rows as forms this class already held, had nowhere to go. Found by the
         appendix coverage check.
         The -ειν first and second singulars are NOT on the page; they are the
         house pattern every other perfect in this file already carries
         (ἐτετιμήκειν, ἐπεποιήκειν, ἐδεδώκειν), and leaving them out would mark
         wrong the form he would reach for by analogy with the four verbs beside
         this one. */
      'plup.act': { '1sg':['ἐδεδηλώκειν','ἐδεδηλώκη'], '2sg':['ἐδεδηλώκεις','ἐδεδηλώκης'], '3sg':'ἐδεδηλώκει(ν)', '1pl':'ἐδεδηλώκεμεν', '2pl':'ἐδεδηλώκετε', '3pl':'ἐδεδηλώκεσαν' },
      'plup.mp': { '1sg':'ἐδεδηλώμην', '2sg':'ἐδεδήλωσο', '3sg':'ἐδεδήλωτο', '1pl':'ἐδεδηλώμεθα', '2pl':'ἐδεδήλωσθε', '3pl':'ἐδεδήλωντο' },

      /* ---- the non-indicative moods and the infinitives ----
         ο + ῃ contracts to οι, so δηλοῖς and δηλοῖ are both indicative and
         subjunctive while δηλῶτε is subjunctive alone -- a paradigm that is
         partly syncretic with its own indicative and partly not. No
         pluperfect and no future perfect, as the indicative has neither. ---- */
      'pres.act.subj': { '1sg':'δηλῶ', '2sg':'δηλοῖς', '3sg':'δηλοῖ', '1pl':'δηλῶμεν', '2pl':'δηλῶτε', '3pl':'δηλῶσι(ν)' },
      'pres.act.opt': { '1sg':['δηλοίην','δηλοῖμι'], '2sg':['δηλοίης','δηλοῖς'], '3sg':['δηλοίη','δηλοῖ'], '1pl':['δηλοῖμεν','δηλοίημεν'], '2pl':['δηλοῖτε','δηλοίητε'], '3pl':['δηλοῖεν','δηλοίησαν'] },
      'pres.act.imper': { '2sg':'δήλου', '3sg':'δηλούτω', '2pl':'δηλοῦτε', '3pl':'δηλούντων' },
      'pres.mp.subj': { '1sg':'δηλῶμαι', '2sg':'δηλοῖ', '3sg':'δηλῶται', '1pl':'δηλώμεθα', '2pl':'δηλῶσθε', '3pl':'δηλῶνται' },
      'pres.mp.opt': { '1sg':'δηλοίμην', '2sg':'δηλοῖο', '3sg':'δηλοῖτο', '1pl':'δηλοίμεθα', '2pl':'δηλοῖσθε', '3pl':'δηλοῖντο' },
      'pres.mp.imper': { '2sg':'δηλοῦ', '3sg':'δηλούσθω', '2pl':'δηλοῦσθε', '3pl':'δηλούσθων' },
      'fut.act.opt': { '1sg':'δηλώσοιμι', '2sg':'δηλώσοις', '3sg':'δηλώσοι', '1pl':'δηλώσοιμεν', '2pl':'δηλώσοιτε', '3pl':'δηλώσοιεν' },
      'fut.mid.opt': { '1sg':'δηλωσοίμην', '2sg':'δηλώσοιο', '3sg':'δηλώσοιτο', '1pl':'δηλωσοίμεθα', '2pl':'δηλώσοισθε', '3pl':'δηλώσοιντο' },
      'fut.pass.opt': { '1sg':'δηλωθησοίμην', '2sg':'δηλωθήσοιο', '3sg':'δηλωθήσοιτο', '1pl':'δηλωθησοίμεθα', '2pl':'δηλωθήσοισθε', '3pl':'δηλωθήσοιντο' },
      'aor.act.subj': { '1sg':'δηλώσω', '2sg':'δηλώσῃς', '3sg':'δηλώσῃ', '1pl':'δηλώσωμεν', '2pl':'δηλώσητε', '3pl':'δηλώσωσι(ν)' },
      'aor.act.opt': { '1sg':'δηλώσαιμι', '2sg':['δηλώσειας','δηλώσαις'], '3sg':['δηλώσειε(ν)','δηλώσαι'], '1pl':'δηλώσαιμεν', '2pl':'δηλώσαιτε', '3pl':['δηλώσειαν','δηλώσαιεν'] },
      'aor.act.imper': { '2sg':'δήλωσον', '3sg':'δηλωσάτω', '2pl':'δηλώσατε', '3pl':'δηλωσάντων' },
      'aor.mid.subj': { '1sg':'δηλώσωμαι', '2sg':'δηλώσῃ', '3sg':'δηλώσηται', '1pl':'δηλωσώμεθα', '2pl':'δηλώσησθε', '3pl':'δηλώσωνται' },
      'aor.mid.opt': { '1sg':'δηλωσαίμην', '2sg':'δηλώσαιο', '3sg':'δηλώσαιτο', '1pl':'δηλωσαίμεθα', '2pl':'δηλώσαισθε', '3pl':'δηλώσαιντο' },
      'aor.mid.imper': { '2sg':'δήλωσαι', '3sg':'δηλωσάσθω', '2pl':'δηλώσασθε', '3pl':'δηλωσάσθων' },
      'aor.pass.subj': { '1sg':'δηλωθῶ', '2sg':'δηλωθῇς', '3sg':'δηλωθῇ', '1pl':'δηλωθῶμεν', '2pl':'δηλωθῆτε', '3pl':'δηλωθῶσι(ν)' },
      'aor.pass.opt': { '1sg':'δηλωθείην', '2sg':'δηλωθείης', '3sg':'δηλωθείη', '1pl':['δηλωθεῖμεν','δηλωθείημεν'], '2pl':['δηλωθεῖτε','δηλωθείητε'], '3pl':['δηλωθεῖεν','δηλωθείησαν'] },
      'aor.pass.imper': { '2sg':'δηλώθητι', '3sg':'δηλωθήτω', '2pl':'δηλώθητε', '3pl':'δηλωθέντων' },
      'pres.act.inf': { inf:'δηλοῦν' },
      'pres.mp.inf': { inf:'δηλοῦσθαι' },
      'fut.act.inf': { inf:'δηλώσειν' },
      'fut.mid.inf': { inf:'δηλώσεσθαι' },
      'fut.pass.inf': { inf:'δηλωθήσεσθαι' },
      'aor.act.inf': { inf:'δηλῶσαι' },
      'aor.mid.inf': { inf:'δηλώσασθαι' },
      'aor.pass.inf': { inf:'δηλωθῆναι' },
      'perf.act.inf': { inf:'δεδηλωκέναι' },
      'perf.mp.inf': { inf:'δεδηλῶσθαι' }
    }
  },


  /* --- fifth generated tranche: the remaining core adjective patterns. Two
     irregulars whose stem changes between the nominative and everything else
     (μέγας, πολύς), the -ύς -εῖα -ύ type that is third declension in the
     masculine and neuter but first in the feminine, and the two-termination
     ν-stem. --- */

  // Irregular: μέγας and μέγα beside a μεγαλ- stem everywhere else.
  adj_megas: {
    kind: 'adj', label: 'μέγας (great)', literal: true,
    subtitle: 'μέγας, μεγάλη, μέγα — great, large',
    example: { lemma:'μέγας', class:'adj_megas', meaning:'TODO' },
    genders: ['m','f','n'],
    categories: ['nom','acc','gen','dat','voc'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { 'm.sg':'μέγας', 'f.sg':'μεγάλη', 'n.sg':'μέγα',
             'm.pl':'μεγάλοι', 'f.pl':'μεγάλαι', 'n.pl':'μεγάλα' },
      acc: { 'm.sg':'μέγαν', 'f.sg':'μεγάλην', 'n.sg':'μέγα',
             'm.pl':'μεγάλους', 'f.pl':'μεγάλας', 'n.pl':'μεγάλα' },
      gen: { 'm.sg':'μεγάλου', 'f.sg':'μεγάλης', 'n.sg':'μεγάλου',
             'm.pl':'μεγάλων', 'f.pl':'μεγάλων', 'n.pl':'μεγάλων' },
      dat: { 'm.sg':'μεγάλῳ', 'f.sg':'μεγάλῃ', 'n.sg':'μεγάλῳ',
             'm.pl':'μεγάλοις', 'f.pl':'μεγάλαις', 'n.pl':'μεγάλοις' },
      voc: { 'm.sg':['μέγας','μεγάλε'], 'f.sg':'μεγάλη', 'n.sg':'μέγα',
             'm.pl':'μεγάλοι', 'f.pl':'μεγάλαι', 'n.pl':'μεγάλα' }
    }
  },

  // Irregular in the same way: πολύς / πολύ beside a πολλ- stem.
  adj_polys: {
    kind: 'adj', label: 'πολύς (much, many)', literal: true,
    subtitle: 'πολύς, πολλή, πολύ — much, many',
    example: { lemma:'πολύς', class:'adj_polys', meaning:'TODO' },
    genders: ['m','f','n'],
    categories: ['nom','acc','gen','dat','voc'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { 'm.sg':'πολύς', 'f.sg':'πολλή', 'n.sg':'πολύ',
             'm.pl':'πολλοί', 'f.pl':'πολλαί', 'n.pl':'πολλά' },
      acc: { 'm.sg':'πολύν', 'f.sg':'πολλήν', 'n.sg':'πολύ',
             'm.pl':'πολλούς', 'f.pl':'πολλάς', 'n.pl':'πολλά' },
      gen: { 'm.sg':'πολλοῦ', 'f.sg':'πολλῆς', 'n.sg':'πολλοῦ',
             'm.pl':'πολλῶν', 'f.pl':'πολλῶν', 'n.pl':'πολλῶν' },
      dat: { 'm.sg':'πολλῷ', 'f.sg':'πολλῇ', 'n.sg':'πολλῷ',
             'm.pl':'πολλοῖς', 'f.pl':'πολλαῖς', 'n.pl':'πολλοῖς' },
      voc: { 'm.sg':'πολύ', 'f.sg':'πολλή', 'n.sg':'πολύ',
             'm.pl':'πολλοί', 'f.pl':'πολλαί', 'n.pl':'πολλά' }
    }
  },

  // Third declension in the masculine and neuter, first in the feminine.
  adj_ys_eia_y: {
    kind: 'adj', label: 'Adjectives in -ύς, -εῖα, -ύ', literal: true,
    subtitle: 'ταχύς, ταχεῖα, ταχύ — swift',
    example: { lemma:'ταχύς', class:'adj_ys_eia_y', meaning:'TODO' },
    genders: ['m','f','n'],
    categories: ['nom','acc','gen','dat','voc'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { 'm.sg':'ταχύς', 'f.sg':'ταχεῖα', 'n.sg':'ταχύ',
             'm.pl':'ταχεῖς', 'f.pl':'ταχεῖαι', 'n.pl':'ταχέα' },
      acc: { 'm.sg':'ταχύν', 'f.sg':'ταχεῖαν', 'n.sg':'ταχύ',
             'm.pl':'ταχεῖς', 'f.pl':'ταχείας', 'n.pl':'ταχέα' },
      gen: { 'm.sg':'ταχέος', 'f.sg':'ταχείας', 'n.sg':'ταχέος',
             'm.pl':'ταχέων', 'f.pl':'ταχειῶν', 'n.pl':'ταχέων' },
      dat: { 'm.sg':'ταχεῖ', 'f.sg':'ταχείᾳ', 'n.sg':'ταχεῖ',
             'm.pl':'ταχέσι', 'f.pl':'ταχείαις', 'n.pl':'ταχέσι' },
      voc: { 'm.sg':'ταχύ', 'f.sg':'ταχεῖα', 'n.sg':'ταχύ',
             'm.pl':'ταχεῖς', 'f.pl':'ταχεῖαι', 'n.pl':'ταχέα' }
    }
  },

  // Two terminations, ν-stem. The vocative shortens: σῶφρον.
  adj_wn_on: {
    kind: 'adj', label: 'Adjectives in -ων, -ον', literal: true,
    subtitle: 'σώφρων, σῶφρον — prudent, self-controlled',
    example: { lemma:'σώφρων', class:'adj_wn_on', meaning:'TODO' },
    genders: ['mf','n'],
    categories: ['nom','acc','gen','dat','voc'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { 'mf.sg':'σώφρων', 'n.sg':'σῶφρον',
             'mf.pl':'σώφρονες', 'n.pl':'σώφρονα' },
      acc: { 'mf.sg':'σώφρονα', 'n.sg':'σῶφρον',
             'mf.pl':'σώφρονας', 'n.pl':'σώφρονα' },
      gen: { 'mf.sg':'σώφρονος', 'n.sg':'σώφρονος',
             'mf.pl':'σωφρόνων', 'n.pl':'σωφρόνων' },
      dat: { 'mf.sg':'σώφρονι', 'n.sg':'σώφρονι',
             'mf.pl':'σώφροσι', 'n.pl':'σώφροσι' },
      voc: { 'mf.sg':'σῶφρον', 'n.sg':'σῶφρον',
             'mf.pl':'σώφρονες', 'n.pl':'σώφρονα' }
    }
  },

  /* --- the personal pronouns: hand-authored, because they are SUPPLETIVE
     across number. ἐγώ and ἡμεῖς are not two forms of one stem, they are two
     words, and Wiktionary carries them on two separate pages -- so no single
     table exists to generate from, exactly as the buildout audit predicted for
     this group. Every form below was still checked against its own page;
     verify_greek.py knows the pairing (see SUPPLETIVE there) so these are not
     quietly exempt from verification.

     Each oblique singular has two forms: the emphatic (ἐμοῦ) and the enclitic,
     unemphatic one (μου). Both are stored, so the table prints the emphatic
     and either is accepted. No vocative: you do not address "I", and σύ's
     apparent vocative τᾶν is a separate word. --- */
  pron_ego: {
    kind: 'noun', label: 'ἐγώ (I, we)', literal: true,
    subtitle: 'ἐγώ, ἡμεῖς — the first person',
    example: { lemma:'ἐγώ', class:'pron_ego', meaning:'I, we' },
    categories: ['nom','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { sg:'ἐγώ',            pl:'ἡμεῖς' },
      acc: { sg:['ἐμέ','με'],     pl:'ἡμᾶς' },
      gen: { sg:['ἐμοῦ','μου'],   pl:'ἡμῶν' },
      dat: { sg:['ἐμοί','μοι'],   pl:'ἡμῖν' }
    }
  },

  pron_sy: {
    kind: 'noun', label: 'σύ (you)', literal: true,
    subtitle: 'σύ, ὑμεῖς — the second person',
    example: { lemma:'σύ', class:'pron_sy', meaning:'you' },
    categories: ['nom','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { sg:'σύ',           pl:'ὑμεῖς' },
      acc: { sg:['σέ','σε'],    pl:'ὑμᾶς' },
      gen: { sg:['σοῦ','σου'],  pl:'ὑμῶν' },
      dat: { sg:['σοί','σοι'],  pl:'ὑμῖν' }
    }
  },


  /* --- sixth tranche: the participle system of λύω.

     Participles are about a quarter of the grammar appendix and were the
     single biggest gap. Each gets its OWN class rather than living under λύω,
     which is what the buildout plan recommends and what Wiktionary does: 24
     cells x nine systems buried inside one verb entry would make both the
     drill queue and any future reference view unusable.

     A participle is an adjective in shape, so `kind: 'adj'` and the gender
     axis carry them with no engine change at all.

     NO VOCATIVE: the appendix prints participles with Nom./Gen./Dat./Acc. only
     (confirmed against the pages during the buildout audit), so the generator
     was told to emit those four and nothing else -- Wiktionary offers a
     vocative and it is dropped deliberately rather than kept because it
     happened to be complete.

     The aorist middle participle λυσάμενος is ABSENT: Wiktionary has no
     declension table for it, and hand-authoring twenty-four forms with no
     source is exactly what this pipeline exists to avoid. --- */

  // The dative plurals below carry "(ν)": every one of them ends in -σι and
  // takes a movable nu, which his page prints (λύουσιν, λελυκόσιν) and the deck
  // rejected until 2026-08-22. The bracket means the movable nu and nothing
  // else -- see js/greek.js.
  part_pres_act: {
    kind: 'adj', label: 'Present active participle', literal: true,
    subtitle: 'λύων, λύουσα, λῦον — loosing',
    example: { lemma:'λύων', class:'part_pres_act', meaning:'loosing' },
    genders: ['m','f','n'],
    categories: ['nom','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { 'm.sg':'λύων', 'f.sg':'λύουσα', 'n.sg':'λῦον',
             'm.pl':'λύοντες', 'f.pl':'λύουσαι', 'n.pl':'λύοντα' },
      acc: { 'm.sg':'λύοντα', 'f.sg':'λύουσαν', 'n.sg':'λῦον',
             'm.pl':'λύοντας', 'f.pl':'λυούσας', 'n.pl':'λύοντα' },
      gen: { 'm.sg':'λύοντος', 'f.sg':'λυούσης', 'n.sg':'λύοντος',
             'm.pl':'λυόντων', 'f.pl':'λυουσῶν', 'n.pl':'λυόντων' },
      dat: { 'm.sg':'λύοντι', 'f.sg':'λυούσῃ', 'n.sg':'λύοντι',
             'm.pl':'λύουσι(ν)', 'f.pl':'λυούσαις', 'n.pl':'λύουσι(ν)' }
    }
  },

  part_pres_mp: {
    kind: 'adj', label: 'Present middle/passive participle', literal: true,
    subtitle: 'λυόμενος, -η, -ον — being loosed',
    example: { lemma:'λυόμενος', class:'part_pres_mp', meaning:'being loosed' },
    genders: ['m','f','n'],
    categories: ['nom','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { 'm.sg':'λυόμενος', 'f.sg':'λυομένη', 'n.sg':'λυόμενον',
             'm.pl':'λυόμενοι', 'f.pl':'λυόμεναι', 'n.pl':'λυόμενα' },
      acc: { 'm.sg':'λυόμενον', 'f.sg':'λυομένην', 'n.sg':'λυόμενον',
             'm.pl':'λυομένους', 'f.pl':'λυομένας', 'n.pl':'λυόμενα' },
      gen: { 'm.sg':'λυομένου', 'f.sg':'λυομένης', 'n.sg':'λυομένου',
             'm.pl':'λυομένων', 'f.pl':'λυομένων', 'n.pl':'λυομένων' },
      dat: { 'm.sg':'λυομένῳ', 'f.sg':'λυομένῃ', 'n.sg':'λυομένῳ',
             'm.pl':'λυομένοις', 'f.pl':'λυομέναις', 'n.pl':'λυομένοις' }
    }
  },

  part_fut_act: {
    kind: 'adj', label: 'Future active participle', literal: true,
    subtitle: 'λύσων, -ουσα, -ον — about to loose',
    example: { lemma:'λύσων', class:'part_fut_act', meaning:'about to loose' },
    genders: ['m','f','n'],
    categories: ['nom','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { 'm.sg':'λύσων', 'f.sg':'λύσουσα', 'n.sg':'λῦσον',
             'm.pl':'λύσοντες', 'f.pl':'λύσουσαι', 'n.pl':'λύσοντα' },
      acc: { 'm.sg':'λύσοντα', 'f.sg':'λύσουσαν', 'n.sg':'λῦσον',
             'm.pl':'λύσοντας', 'f.pl':'λυσούσας', 'n.pl':'λύσοντα' },
      gen: { 'm.sg':'λύσοντος', 'f.sg':'λυσούσης', 'n.sg':'λύσοντος',
             'm.pl':'λυσόντων', 'f.pl':'λυσουσῶν', 'n.pl':'λυσόντων' },
      dat: { 'm.sg':'λύσοντι', 'f.sg':'λυσούσῃ', 'n.sg':'λύσοντι',
             'm.pl':'λύσουσι(ν)', 'f.pl':'λυσούσαις', 'n.pl':'λύσουσι(ν)' }
    }
  },

  part_fut_mid: {
    kind: 'adj', label: 'Future middle participle', literal: true,
    subtitle: 'λυσόμενος, -η, -ον',
    example: { lemma:'λυσόμενος', class:'part_fut_mid', meaning:'participle' },
    genders: ['m','f','n'],
    categories: ['nom','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { 'm.sg':'λυσόμενος', 'f.sg':'λυσομένη', 'n.sg':'λυσόμενον',
             'm.pl':'λυσόμενοι', 'f.pl':'λυσόμεναι', 'n.pl':'λυσόμενα' },
      acc: { 'm.sg':'λυσόμενον', 'f.sg':'λυσομένην', 'n.sg':'λυσόμενον',
             'm.pl':'λυσομένους', 'f.pl':'λυσομένας', 'n.pl':'λυσόμενα' },
      gen: { 'm.sg':'λυσομένου', 'f.sg':'λυσομένης', 'n.sg':'λυσομένου',
             'm.pl':'λυσομένων', 'f.pl':'λυσομένων', 'n.pl':'λυσομένων' },
      dat: { 'm.sg':'λυσομένῳ', 'f.sg':'λυσομένῃ', 'n.sg':'λυσομένῳ',
             'm.pl':'λυσομένοις', 'f.pl':'λυσομέναις', 'n.pl':'λυσομένοις' }
    }
  },

  part_aor_act: {
    kind: 'adj', label: 'Aorist active participle', literal: true,
    subtitle: 'λύσας, λύσασα, λῦσαν — having loosed',
    example: { lemma:'λύσας', class:'part_aor_act', meaning:'having loosed' },
    genders: ['m','f','n'],
    categories: ['nom','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { 'm.sg':'λύσας', 'f.sg':'λύσασα', 'n.sg':'λῦσαν',
             'm.pl':'λύσαντες', 'f.pl':'λύσασαι', 'n.pl':'λύσαντα' },
      acc: { 'm.sg':'λύσαντα', 'f.sg':'λύσασαν', 'n.sg':'λῦσαν',
             'm.pl':'λύσαντας', 'f.pl':'λυσάσας', 'n.pl':'λύσαντα' },
      gen: { 'm.sg':'λύσαντος', 'f.sg':'λυσάσης', 'n.sg':'λύσαντος',
             'm.pl':'λυσάντων', 'f.pl':'λυσασῶν', 'n.pl':'λυσάντων' },
      dat: { 'm.sg':'λύσαντι', 'f.sg':'λυσάσῃ', 'n.sg':'λύσαντι',
             'm.pl':'λύσασι(ν)', 'f.pl':'λυσάσαις', 'n.pl':'λύσασι(ν)' }
    }
  },

  part_aor_pass: {
    kind: 'adj', label: 'Aorist passive participle', literal: true,
    subtitle: 'λυθείς, λυθεῖσα, λυθέν — having been loosed',
    example: { lemma:'λυθείς', class:'part_aor_pass', meaning:'having been loosed' },
    genders: ['m','f','n'],
    categories: ['nom','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { 'm.sg':'λυθείς', 'f.sg':'λυθεῖσα', 'n.sg':'λυθέν',
             'm.pl':'λυθέντες', 'f.pl':'λυθεῖσαι', 'n.pl':'λυθέντα' },
      acc: { 'm.sg':'λυθέντα', 'f.sg':'λυθεῖσαν', 'n.sg':'λυθέν',
             'm.pl':'λυθέντας', 'f.pl':'λυθείσας', 'n.pl':'λυθέντα' },
      gen: { 'm.sg':'λυθέντος', 'f.sg':'λυθείσης', 'n.sg':'λυθέντος',
             'm.pl':'λυθέντων', 'f.pl':'λυθεισῶν', 'n.pl':'λυθέντων' },
      dat: { 'm.sg':'λυθέντι', 'f.sg':'λυθείσῃ', 'n.sg':'λυθέντι',
             'm.pl':'λυθεῖσι(ν)', 'f.pl':'λυθείσαις', 'n.pl':'λυθεῖσι(ν)' }
    }
  },

  part_perf_act: {
    kind: 'adj', label: 'Perfect active participle', literal: true,
    subtitle: 'λελυκώς, -υῖα, -ός — having loosed',
    example: { lemma:'λελυκώς', class:'part_perf_act', meaning:'having loosed' },
    genders: ['m','f','n'],
    categories: ['nom','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { 'm.sg':'λελυκώς', 'f.sg':'λελυκυῖα', 'n.sg':'λελυκός',
             'm.pl':'λελυκότες', 'f.pl':'λελυκυῖαι', 'n.pl':'λελυκότα' },
      acc: { 'm.sg':'λελυκότα', 'f.sg':'λελυκυῖαν', 'n.sg':'λελυκός',
             'm.pl':'λελυκότας', 'f.pl':'λελυκυίας', 'n.pl':'λελυκότα' },
      gen: { 'm.sg':'λελυκότος', 'f.sg':'λελυκυίας', 'n.sg':'λελυκότος',
             'm.pl':'λελυκότων', 'f.pl':'λελυκυιῶν', 'n.pl':'λελυκότων' },
      dat: { 'm.sg':'λελυκότι', 'f.sg':'λελυκυίᾳ', 'n.sg':'λελυκότι',
             'm.pl':'λελυκόσι(ν)', 'f.pl':'λελυκυίαις', 'n.pl':'λελυκόσι(ν)' }
    }
  },

  part_perf_mp: {
    kind: 'adj', label: 'Perfect middle/passive participle', literal: true,
    subtitle: 'λελυμένος, -η, -ον',
    example: { lemma:'λελυμένος', class:'part_perf_mp', meaning:'participle' },
    genders: ['m','f','n'],
    categories: ['nom','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { 'm.sg':'λελυμένος', 'f.sg':'λελυμένη', 'n.sg':'λελυμένον',
             'm.pl':'λελυμένοι', 'f.pl':'λελυμέναι', 'n.pl':'λελυμένα' },
      acc: { 'm.sg':'λελυμένον', 'f.sg':'λελυμένην', 'n.sg':'λελυμένον',
             'm.pl':'λελυμένους', 'f.pl':'λελυμένας', 'n.pl':'λελυμένα' },
      gen: { 'm.sg':'λελυμένου', 'f.sg':'λελυμένης', 'n.sg':'λελυμένου',
             'm.pl':'λελυμένων', 'f.pl':'λελυμένων', 'n.pl':'λελυμένων' },
      dat: { 'm.sg':'λελυμένῳ', 'f.sg':'λελυμένῃ', 'n.sg':'λελυμένῳ',
             'm.pl':'λελυμένοις', 'f.pl':'λελυμέναις', 'n.pl':'λελυμένοις' }
    }
  },

  /* --- the declinable numerals. The OCR specification requires cardinals and
     ordinals; the grammar appendix prints neither, so this is a gap in the
     source material rather than only in the app.

     Only the first four cardinals decline, and they are single-number words:
     "one" has no plural, "three" and "four" no singular. So these classes
     declare cellKeys of just ['sg'] or just ['pl'].

     δύο is DELIBERATELY ABSENT. Its only Attic declension is the DUAL --
     δύο / δυοῖν -- and the specification says in terms that dual forms are not
     required, so Cotidie carries none. Excluding δύο's obliques follows the
     same rule rather than being an oversight. --- */
  num_heis: {
    kind: 'adj', label: 'εἷς (one)', literal: true,
    subtitle: 'εἷς, μία, ἕν — one',
    example: { lemma:'εἷς, μία, ἕν', class:'num_heis', meaning:'one' },
    genders: ['m','f','n'],
    categories: ['nom','acc','gen','dat'],
    cellKeys: ['sg'],
    endings: {
      nom: { 'm.sg':'εἷς',  'f.sg':'μία',  'n.sg':'ἕν' },
      acc: { 'm.sg':'ἕνα',  'f.sg':'μίαν', 'n.sg':'ἕν' },
      gen: { 'm.sg':'ἑνός', 'f.sg':'μιᾶς', 'n.sg':'ἑνός' },
      dat: { 'm.sg':'ἑνί',  'f.sg':'μιᾷ',  'n.sg':'ἑνί' }
    }
  },

  num_treis: {
    kind: 'adj', label: 'τρεῖς (three)', literal: true,
    subtitle: 'τρεῖς, τρία — three',
    example: { lemma:'τρεῖς, τρία', class:'num_treis', meaning:'three' },
    genders: ['mf','n'],
    categories: ['nom','acc','gen','dat'],
    cellKeys: ['pl'],
    endings: {
      nom: { 'mf.pl':'τρεῖς',     'n.pl':'τρία' },
      acc: { 'mf.pl':'τρεῖς',     'n.pl':'τρία' },
      gen: { 'mf.pl':'τριῶν',     'n.pl':'τριῶν' },
      dat: { 'mf.pl':'τρισί(ν)',  'n.pl':'τρισί(ν)' }
    }
  },

  num_tettares: {
    kind: 'adj', label: 'τέτταρες (four)', literal: true,
    subtitle: 'τέτταρες, τέτταρα — four',
    example: { lemma:'τέτταρες, τέτταρα', class:'num_tettares', meaning:'four' },
    genders: ['mf','n'],
    categories: ['nom','acc','gen','dat'],
    cellKeys: ['pl'],
    endings: {
      nom: { 'mf.pl':'τέτταρες',    'n.pl':'τέτταρα' },
      acc: { 'mf.pl':'τέτταρας',    'n.pl':'τέτταρα' },
      gen: { 'mf.pl':'τεττάρων',    'n.pl':'τεττάρων' },
      dat: { 'mf.pl':'τέτταρσι(ν)', 'n.pl':'τέτταρσι(ν)' }
    }
  },

  decl1_e: {
    kind: 'noun', label: '1st Declension (η-stem, feminine)', literal: true,
    subtitle: 'τιμή, τιμῆς, ἡ — honor',
    example: { lemma:'τιμή', class:'decl1_e', gender:'f', meaning:'honor' },
    categories: ['nom','voc','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { sg:'τιμή',  pl:'τιμαί'  },
      voc: { sg:'τιμή',  pl:'τιμαί'  },
      acc: { sg:'τιμήν', pl:'τιμάς'  },
      gen: { sg:'τιμῆς', pl:'τιμῶν'  },
      dat: { sg:'τιμῇ',  pl:'τιμαῖς' }
    }
  },

  decl1_es: {
    kind: 'noun', label: '1st Declension (masculine, -ης)', literal: true,
    subtitle: 'πολίτης, πολίτου, ὁ — citizen',
    example: { lemma:'πολίτης', class:'decl1_es', gender:'m', meaning:'citizen' },
    categories: ['nom','voc','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    // voc. sg. πολῖτα is the well-known exception -- short vowel, shifted
    // accent, genuinely not stem+ending (part of why this class is
    // literal). gen. sg. -ου is borrowed from 2nd declension, also not
    // predictable from the nom./acc./dat. stem shape.
    endings: {
      nom: { sg:'πολίτης', pl:'πολῖται'  },
      voc: { sg:'πολῖτα',  pl:'πολῖται'  },
      acc: { sg:'πολίτην', pl:'πολίτας'  },
      gen: { sg:'πολίτου', pl:'πολιτῶν'  },
      dat: { sg:'πολίτῃ',  pl:'πολίταις' }
    }
  },

  decl2_os: {
    kind: 'noun', label: '2nd Declension (masculine, -ος)', literal: true,
    subtitle: 'λόγος, λόγου, ὁ — word',
    example: { lemma:'λόγος', class:'decl2_os', gender:'m', meaning:'word' },
    categories: ['nom','voc','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { sg:'λόγος', pl:'λόγοι'  },
      voc: { sg:'λόγε',  pl:'λόγοι'  },
      acc: { sg:'λόγον', pl:'λόγους' },
      gen: { sg:'λόγου', pl:'λόγων'  },
      dat: { sg:'λόγῳ',  pl:'λόγοις' }
    }
  },

  decl2_on: {
    kind: 'noun', label: '2nd Declension (neuter, -ον)', literal: true,
    subtitle: 'δῶρον, δώρου, τό — gift',
    example: { lemma:'δῶρον', class:'decl2_on', gender:'n', meaning:'gift' },
    categories: ['nom','voc','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    endings: {
      nom: { sg:'δῶρον', pl:'δῶρα'   },
      voc: { sg:'δῶρον', pl:'δῶρα'   },
      acc: { sg:'δῶρον', pl:'δῶρα'   },
      gen: { sg:'δώρου', pl:'δώρων'  },
      dat: { sg:'δώρῳ',  pl:'δώροις' }
    }
  },

  decl3_ma: {
    kind: 'noun', label: '3rd Declension (neuter, -μα)', literal: true,
    subtitle: 'σῶμα, σώματος, τό — body',
    example: { lemma:'σῶμα', class:'decl3_ma', gender:'n', meaning:'body' },
    categories: ['nom','voc','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    // dat. pl. σώμασι(ν) is stem "σωματ" + "-σι" with a real sandhi rule
    // (dental stop drops before sigma) -- not modeled as a rule (see the
    // file header), just written out correctly here.
    endings: {
      nom: { sg:'σῶμα', pl:'σώματα'    },
      voc: { sg:'σῶμα', pl:'σώματα'    },
      acc: { sg:'σῶμα', pl:'σώματα'    },
      gen: { sg:'σώματος', pl:'σωμάτων'  },
      dat: { sg:'σώματι',  pl:'σώμασι(ν)' }
    }
  },

  decl3_velar: {
    kind: 'noun', label: '3rd Declension (masc./fem., velar stem)', literal: true,
    subtitle: 'φύλαξ, φύλακος, ὁ — guard',
    example: { lemma:'φύλαξ', class:'decl3_velar', gender:'m', meaning:'guard' },
    categories: ['nom','voc','acc','gen','dat'],
    cellKeys: ['sg','pl'],
    // dat. pl. φύλαξι(ν): stem "φυλακ" + "-σι", κ+σ -> ξ sandhi, same
    // reason as decl3_ma's dative plural -- see that class's note.
    endings: {
      nom: { sg:'φύλαξ',  pl:'φύλακες'  },
      voc: { sg:'φύλαξ',  pl:'φύλακες'  },
      acc: { sg:'φύλακα', pl:'φύλακας'  },
      gen: { sg:'φύλακος', pl:'φυλάκων'  },
      dat: { sg:'φύλακι',  pl:'φύλαξι(ν)' }
    }
  },

  /* ---- the one thematic (-ω) paradigm verb ----
     `literal: true`, like everything else in this file -- NOT because
     λύω's own present/imperfect/future/aorist system needs it (that part
     really is clean root "λυ" + ending, and was drafted that way first),
     but because the perfect system (perfect, pluperfect, future perfect)
     is built on the REDUPLICATED stem λελυ-, not the bare root, and this
     engine has no reduplication mechanism -- mixing "mostly formula, but
     three categories secretly need a different base" is exactly the kind
     of thing that produces a silent wrong answer, so every cell is
     written out fully instead. categories are grouped by the traditional
     three systems (present, future, aorist, perfect), each in active-
     then-middle-then-passive order where more than one voice exists for
     that tense. Every cell verified against Wiktionary's λύω conjugation
     table and Wm. Jones White's First Greek Book (daedalus.umkc.edu),
     both fetched directly while writing this file -- see HANDOFF.md. */
  thematic: {
    kind: 'verb', label: 'Thematic (-ω) verbs', literal: true,
    subtitle: 'λύω, λύσω, ἔλυσα, λέλυκα — to loose, free',
    example: { lemma:'λύω', class:'thematic', meaning:'to loose, free' },
    categories: ['pres.act', 'pres.mp', 'impf.act', 'impf.mp', 'fut.act', 'fut.mid', 'fut.pass', 'aor.act', 'aor.mid', 'aor.pass', 'perf.act', 'perf.mp', 'plup.act', 'plup.mp', 'pres.act.subj', 'pres.act.opt', 'pres.act.imper', 'pres.mp.subj', 'pres.mp.opt', 'pres.mp.imper', 'fut.act.opt', 'fut.mid.opt', 'fut.pass.opt', 'aor.act.subj', 'aor.act.opt', 'aor.act.imper', 'aor.mid.subj', 'aor.mid.opt', 'aor.mid.imper', 'aor.pass.subj', 'aor.pass.opt', 'aor.pass.imper', 'pres.act.inf', 'pres.mp.inf', 'fut.act.inf', 'fut.mid.inf', 'fut.pass.inf', 'aor.act.inf', 'aor.mid.inf', 'aor.pass.inf', 'perf.act.inf', 'perf.mp.inf'],
    cellKeys: ['1sg','2sg','3sg','1pl','2pl','3pl'],
    endings: {
      'pres.act': { '1sg':'λύω',   '2sg':'λύεις',  '3sg':'λύει',   '1pl':'λύομεν',  '2pl':'λύετε',  '3pl':'λύουσι(ν)' },
      'pres.mp':  { '1sg':'λύομαι','2sg':['λύῃ','λύει'],'3sg':'λύεται','1pl':'λυόμεθα','2pl':'λύεσθε','3pl':'λύονται' },
      'impf.act': { '1sg':'ἔλυον',  '2sg':'ἔλυες',   '3sg':'ἔλυε(ν)', '1pl':'ἐλύομεν',  '2pl':'ἐλύετε',  '3pl':'ἔλυον' },
      'impf.mp':  { '1sg':'ἐλυόμην','2sg':'ἐλύου',   '3sg':'ἐλύετο',  '1pl':'ἐλυόμεθα', '2pl':'ἐλύεσθε', '3pl':'ἐλύοντο' },
      'fut.act':  { '1sg':'λύσω',  '2sg':'λύσεις', '3sg':'λύσει',  '1pl':'λύσομεν', '2pl':'λύσετε', '3pl':'λύσουσι(ν)' },
      'fut.mid':  { '1sg':'λύσομαι','2sg':['λύσῃ','λύσει'],'3sg':'λύσεται','1pl':'λυσόμεθα','2pl':'λύσεσθε','3pl':'λύσονται' },
      'fut.pass': { '1sg':'λυθήσομαι','2sg':['λυθήσῃ','λυθήσει'],'3sg':'λυθήσεται','1pl':'λυθησόμεθα','2pl':'λυθήσεσθε','3pl':'λυθήσονται' },
      'aor.act':  { '1sg':'ἔλυσα',  '2sg':'ἔλυσας',  '3sg':'ἔλυσε(ν)','1pl':'ἐλύσαμεν', '2pl':'ἐλύσατε', '3pl':'ἔλυσαν' },
      'aor.mid':  { '1sg':'ἐλυσάμην','2sg':'ἐλύσω',  '3sg':'ἐλύσατο', '1pl':'ἐλυσάμεθα','2pl':'ἐλύσασθε','3pl':'ἐλύσαντο' },
      'aor.pass': { '1sg':'ἐλύθην', '2sg':'ἐλύθης',  '3sg':'ἐλύθη',   '1pl':'ἐλύθημεν', '2pl':'ἐλύθητε', '3pl':'ἐλύθησαν' },
      'perf.act': { '1sg':'λέλυκα',  '2sg':'λέλυκας',  '3sg':'λέλυκε(ν)','1pl':'λελύκαμεν', '2pl':'λελύκατε', '3pl':'λελύκασι(ν)' },
      'perf.mp':  { '1sg':'λέλυμαι', '2sg':'λέλυσαι',  '3sg':'λέλυται',  '1pl':'λελύμεθα',  '2pl':'λέλυσθε',  '3pl':'λέλυνται' },
      'plup.act': { '1sg':'ἐλελύκη',  '2sg':'ἐλελύκης',  '3sg':'ἐλελύκει',  '1pl':'ἐλελύκεμεν', '2pl':'ἐλελύκετε', '3pl':'ἐλελύκεσαν' },
      'plup.mp':  { '1sg':'ἐλελύμην', '2sg':'ἐλέλυσο',   '3sg':'ἐλέλυτο',   '1pl':'ἐλελύμεθα',  '2pl':'ἐλέλυσθε',  '3pl':'ἐλέλυντο' },

      // ---- non-indicative moods ----
      // The imperative has four cells where every other category has six:
      // no first person, because an imperative does not have one. This is
      // the ragged paradigm orderedCells() was taught to handle, and the
      // first time it has arrived from real data rather than a fixture.
      'pres.act.subj': { '1sg':'λύω', '2sg':'λύῃς', '3sg':'λύῃ', '1pl':'λύωμεν', '2pl':'λύητε', '3pl':'λύωσι(ν)' },
      'pres.act.opt': { '1sg':'λύοιμι', '2sg':'λύοις', '3sg':'λύοι', '1pl':'λύοιμεν', '2pl':'λύοιτε', '3pl':'λύοιεν' },
      'pres.act.imper': { '2sg':'λῦε', '3sg':'λυέτω', '2pl':'λύετε', '3pl':'λυόντων' },
      'pres.mp.subj': { '1sg':'λύωμαι', '2sg':'λύῃ', '3sg':'λύηται', '1pl':'λυώμεθα', '2pl':'λύησθε', '3pl':'λύωνται' },
      'pres.mp.opt': { '1sg':'λυοίμην', '2sg':'λύοιο', '3sg':'λύοιτο', '1pl':'λυοίμεθα', '2pl':'λύοισθε', '3pl':'λύοιντο' },
      'pres.mp.imper': { '2sg':'λύου', '3sg':'λυέσθω', '2pl':'λύεσθε', '3pl':'λυέσθων' },
      // The FUTURE optative, which has no subjunctive or imperative beside
      // it -- Greek has a future optative and no future subjunctive, so this
      // is not a partial row but the whole of what the future mood system is.
      'fut.act.opt': { '1sg':'λύσοιμι', '2sg':'λύσοις', '3sg':'λύσοι', '1pl':'λύσοιμεν', '2pl':'λύσοιτε', '3pl':'λύσοιεν' },
      'fut.mid.opt': { '1sg':'λυσοίμην', '2sg':'λύσοιο', '3sg':'λύσοιτο', '1pl':'λυσοίμεθα', '2pl':'λύσοισθε', '3pl':'λύσοιντο' },
      'fut.pass.opt': { '1sg':'λυθησοίμην', '2sg':'λυθήσοιο', '3sg':'λυθήσοιτο', '1pl':'λυθησοίμεθα', '2pl':'λυθήσοισθε', '3pl':'λυθήσοιντο' },
      'aor.act.subj': { '1sg':'λύσω', '2sg':'λύσῃς', '3sg':'λύσῃ', '1pl':'λύσωμεν', '2pl':'λύσητε', '3pl':'λύσωσι(ν)' },
      'aor.act.opt': { '1sg':'λύσαιμι', '2sg':['λύσειας','λύσαις'], '3sg':['λύσειε(ν)','λύσαι'], '1pl':'λύσαιμεν', '2pl':'λύσαιτε', '3pl':['λύσειαν','λύσαιεν'] },
      'aor.act.imper': { '2sg':'λῦσον', '3sg':'λυσάτω', '2pl':'λύσατε', '3pl':'λυσάντων' },
      'aor.mid.subj': { '1sg':'λύσωμαι', '2sg':'λύσῃ', '3sg':'λύσηται', '1pl':'λυσώμεθα', '2pl':'λύσησθε', '3pl':'λύσωνται' },
      'aor.mid.opt': { '1sg':'λυσαίμην', '2sg':'λύσαιο', '3sg':'λύσαιτο', '1pl':'λυσαίμεθα', '2pl':'λύσαισθε', '3pl':'λύσαιντο' },
      'aor.mid.imper': { '2sg':'λῦσαι', '3sg':'λυσάσθω', '2pl':'λύσασθε', '3pl':'λυσάσθων' },
      'aor.pass.subj': { '1sg':'λυθῶ', '2sg':'λυθῇς', '3sg':'λυθῇ', '1pl':'λυθῶμεν', '2pl':'λυθῆτε', '3pl':'λυθῶσι(ν)' },
      'aor.pass.opt': { '1sg':'λυθείην', '2sg':'λυθείης', '3sg':'λυθείη', '1pl':['λυθεῖμεν','λυθείημεν'], '2pl':['λυθεῖτε','λυθείητε'], '3pl':['λυθεῖεν','λυθείησαν'] },
      'aor.pass.imper': { '2sg':'λύθητι', '3sg':'λυθήτω', '2pl':'λύθητε', '3pl':'λυθέντων' },
      // Periphrastic: a perfect middle/passive participle beside the
      // optative of εἰμί. Both auxiliaries are Attic and the participle
      // belongs to BOTH -- it used to read `['λελυμένοι εἴημεν','εἶμεν']`,
      // which accepted a bare `εἶμεν` as this cell's answer.

      // ---- the infinitives ----
      // ONE cell each, under a key ('inf') that is not in this class's
      // cellKeys at all. That is the other half of the ragged-paradigm
      // work -- the buildout plan singled the infinitive out as the worse
      // case, one cell against six -- and it needed no further change.
      'pres.act.inf': { inf:'λύειν' },
      'pres.mp.inf': { inf:'λύεσθαι' },
      'fut.act.inf': { inf:'λύσειν' },
      'fut.mid.inf': { inf:'λύσεσθαι' },
      'fut.pass.inf': { inf:'λυθήσεσθαι' },
      'aor.act.inf': { inf:'λῦσαι' },
      'aor.mid.inf': { inf:'λύσασθαι' },
      'aor.pass.inf': { inf:'λυθῆναι' },
      'perf.act.inf': { inf:'λελυκέναι' },
      'perf.mp.inf': { inf:'λελύσθαι' },
    }
  },

  /* ---- athematic (-μι) verbs, six of them, each fully literal ----
     Present/imperfect/future indicative only for v1 (aorist and perfect
     systems for these are a follow-up -- see HANDOFF.md). Every cell
     cross-checked against Wiktionary while writing this file. */

  athematic_eimi: {
    kind: 'verb', label: 'εἰμί (to be)', literal: true,
    subtitle: 'εἰμί, ἔσομαι — to be',
    example: { lemma:'εἰμί', class:'athematic_eimi', meaning:'to be' },
    // "to be" has no separate voice -- its future ἔσομαι is middle in
    // FORM but there is no contrasting active future to distinguish it
    // from, so it's simply labelled fut.act here for a uniform category
    // set across the athematic verbs (see HANDOFF.md).
    categories: [
      'pres.act',
      'impf.act',
      'fut.act',
      'pres.act.subj',
      'pres.act.opt',
      'pres.act.imper',
      'fut.act.opt',
      'pres.act.inf',
      'fut.act.inf'],
    cellKeys: ['1sg','2sg','3sg','1pl','2pl','3pl'],
    endings: {
      'pres.act': { '1sg':'εἰμί', '2sg':'εἶ',   '3sg':'ἐστί(ν)', '1pl':'ἐσμέν', '2pl':'ἐστέ', '3pl':'εἰσί(ν)' },
      'impf.act': { '1sg':['ἦν','ἦ'], '2sg':'ἦσθα', '3sg':'ἦν', '1pl':'ἦμεν', '2pl':['ἦτε','ἦστε'], '3pl':'ἦσαν' },
      'fut.act':  { '1sg':'ἔσομαι','2sg':['ἔσῃ','ἔσει'],'3sg':'ἔσται','1pl':'ἐσόμεθα','2pl':'ἔσεσθε','3pl':'ἔσονται' },

      /* ---- the non-indicative moods and the two infinitives ----
         εἰμί has no aorist and no perfect, so there is nothing for a
         subjunctive or an optative to attach to beyond the present: four new
         categories where every other verb here gets twenty-five or more.
         That is the paradigm, not a gap.

         fut.act.opt and fut.act.inf are filed under 'act' for the same reason
         fut.act is -- ἐσοίμην and ἔσεσθαι are middle in form, and there is no
         contrasting active future to distinguish them from. The verifier
         aliases all three onto the oracle's fut.mid so they are checked
         rather than skipped. ---- */
      'pres.act.subj': { '1sg':'ὦ', '2sg':'ᾖς', '3sg':'ᾖ', '1pl':'ὦμεν', '2pl':'ἦτε', '3pl':'ὦσι(ν)' },
      'pres.act.opt': { '1sg':['εἴην','εἶμι'], '2sg':['εἴης','εἶς'], '3sg':['εἴη','εἶ'], '1pl':['εἶμεν','εἴημεν'], '2pl':['εἶτε','εἴητε'], '3pl':['εἶεν','εἴησαν'] },
      'pres.act.imper': { '2sg':'ἴσθι', '3sg':['ἔστω','ἤτω'], '2pl':'ἔστε', '3pl':['ἔστων','ἔστωσαν','ὄντων'] },
      'fut.act.opt': { '1sg':'ἐσοίμην', '2sg':'ἔσοιο', '3sg':'ἔσοιτο', '1pl':'ἐσοίμεθα', '2pl':'ἔσοισθε', '3pl':'ἔσοιντο' },
      'pres.act.inf': { inf:'εἶναι' },
      'fut.act.inf': { inf:'ἔσεσθαι' }
    }
  },

  athematic_didomi: {
    kind: 'verb', label: 'δίδωμι (to give)', literal: true,
    subtitle: 'δίδωμι, δώσω — to give',
    example: { lemma:'δίδωμι', class:'athematic_didomi', meaning:'to give' },
    categories: ['pres.act', 'pres.mp', 'impf.act', 'impf.mp', 'fut.act', 'fut.mid', 'fut.pass', 'aor.act', 'aor.mid', 'aor.pass', 'perf.act', 'perf.mp', 'plup.act', 'plup.mp', 'futperf.mp', 'pres.act.subj', 'pres.act.opt', 'pres.act.imper', 'pres.mp.subj', 'pres.mp.opt', 'pres.mp.imper', 'fut.act.opt', 'fut.mid.opt', 'fut.pass.opt', 'aor.act.subj', 'aor.act.opt', 'aor.act.imper', 'aor.mid.subj', 'aor.mid.opt', 'aor.mid.imper', 'aor.pass.subj', 'aor.pass.opt', 'aor.pass.imper', 'perf.act.subj', 'perf.act.opt', 'perf.act.imper', 'perf.mp.subj', 'perf.mp.opt', 'perf.mp.imper', 'futperf.mp.opt', 'pres.act.inf', 'pres.mp.inf', 'fut.act.inf', 'fut.mid.inf', 'fut.pass.inf', 'aor.act.inf', 'aor.mid.inf', 'aor.pass.inf', 'perf.act.inf', 'perf.mp.inf', 'futperf.mp.inf'],
    cellKeys: ['1sg','2sg','3sg','1pl','2pl','3pl'],
    endings: {
      'pres.act': { '1sg':'δίδωμι', '2sg':'δίδως',  '3sg':'δίδωσι(ν)', '1pl':'δίδομεν',  '2pl':'δίδοτε',  '3pl':'διδόασι(ν)' },
      'pres.mp':  { '1sg':'δίδομαι','2sg':'δίδοσαι','3sg':'δίδοται',   '1pl':'διδόμεθα', '2pl':'δίδοσθε', '3pl':'δίδονται' },
      'impf.act': { '1sg':'ἐδίδουν','2sg':'ἐδίδους','3sg':'ἐδίδου',   '1pl':'ἐδίδομεν', '2pl':'ἐδίδοτε', '3pl':'ἐδίδοσαν' },
      'impf.mp':  { '1sg':'ἐδιδόμην','2sg':'ἐδίδοσο','3sg':'ἐδίδοτο', '1pl':'ἐδιδόμεθα','2pl':'ἐδίδοσθε','3pl':'ἐδίδοντο' },
      'fut.act':  { '1sg':'δώσω',   '2sg':'δώσεις', '3sg':'δώσει',    '1pl':'δώσομεν',  '2pl':'δώσετε',  '3pl':'δώσουσι(ν)' },

      // ---- aorist and perfect systems (closes HANDOFF open item 3) ----
      'aor.act': { '1sg':'ἔδωκα', '2sg':'ἔδωκας', '3sg':'ἔδωκε(ν)', '1pl':['ἔδομεν','ἐδώκαμεν'], '2pl':['ἔδοτε','ἐδώκατε'], '3pl':['ἔδοσαν','ἔδωκαν'] },
      'aor.mid': { '1sg':['ἐδόμην','ἐδωκάμην'], '2sg':['ἔδου','ἐδώκω'], '3sg':['ἔδοτο','ἐδώκατο'], '1pl':['ἐδόμεθα','ἐδωκάμεθα'], '2pl':['ἔδοσθε','ἐδώκασθε'], '3pl':['ἔδοντο','ἐδώκαντο'] },
      'aor.pass': { '1sg':'ἐδόθην', '2sg':'ἐδόθης', '3sg':'ἐδόθη', '1pl':'ἐδόθημεν', '2pl':'ἐδόθητε', '3pl':'ἐδόθησαν' },
      'perf.act': { '1sg':'δέδωκα', '2sg':'δέδωκας', '3sg':'δέδωκε(ν)', '1pl':'δεδώκαμεν', '2pl':'δεδώκατε', '3pl':'δεδώκασι(ν)' },
      'perf.mp': { '1sg':'δέδομαι', '2sg':'δέδοσαι', '3sg':'δέδοται', '1pl':'δεδόμεθα', '2pl':'δέδοσθε', '3pl':'δέδονται' },
      'plup.act': { '1sg':['ἐδεδώκειν','ἐδεδώκη'], '2sg':['ἐδεδώκεις','ἐδεδώκης'], '3sg':'ἐδεδώκει(ν)', '1pl':'ἐδεδώκεμεν', '2pl':'ἐδεδώκετε', '3pl':'ἐδεδώκεσαν' },
      'plup.mp': { '1sg':'ἐδεδόμην', '2sg':'ἐδέδοσο', '3sg':'ἐδέδοτο', '1pl':'ἐδεδόμεθα', '2pl':'ἐδέδοσθε', '3pl':'ἐδέδοντο' },

      /* ---- the non-indicative moods and the infinitives ----
         The future middle, future passive and future perfect arrive with
         them: an optative cannot sit on a tense whose indicative is absent,
         so fut.pass.opt brought fut.pass with it.

         aor.pass.imper 2sg is δόθητι, and Wiktionary prints δόθηθι. The
         first aorist passive imperative ending -θι dissimilates to -τι after
         -θη-, which is why every attested form is -θητι, and which
         Wiktionary itself does for the other seven verbs in this deck. See
         ADJUDICATED in tools/verify/verify_greek.py. ---- */
      'fut.mid': { '1sg':'δώσομαι', '2sg':['δώσῃ','δώσει'], '3sg':'δώσεται', '1pl':'δωσόμεθα', '2pl':'δώσεσθε', '3pl':'δώσονται' },
      'fut.pass': { '1sg':'δοθήσομαι', '2sg':['δοθήσῃ','δοθήσει'], '3sg':'δοθήσεται', '1pl':'δοθησόμεθα', '2pl':'δοθήσεσθε', '3pl':'δοθήσονται' },
      'pres.act.subj': { '1sg':'διδῶ', '2sg':'διδῷς', '3sg':'διδῷ', '1pl':'διδῶμεν', '2pl':'διδῶτε', '3pl':'διδῶσι(ν)' },
      // Both series in the singular as well as the plural. Every one of these
      // lines already carried the short forms in the PLURAL and the long ones
      // alone in the singular, so διδοῖμι -- printed on p.344 beside διδοίην,
      // and the commoner of the two in Attic -- was marked wrong by a class
      // that accepts διδοῖμεν three cells later. Found by the appendix coverage
      // check (test 33), which reports what his page prints and the deck rejects.
      'pres.act.opt': { '1sg':['διδοίην','διδοῖμι'], '2sg':['διδοίης','διδοῖς'], '3sg':['διδοίη','διδοῖ'], '1pl':['διδοῖμεν','διδοίημεν'], '2pl':['διδοῖτε','διδοίητε'], '3pl':['διδοῖεν','διδοίησαν'] },
      'pres.act.imper': { '2sg':'δίδου', '3sg':'διδότω', '2pl':'δίδοτε', '3pl':'διδόντων' },
      'pres.mp.subj': { '1sg':'διδῶμαι', '2sg':'διδῷ', '3sg':'διδῶται', '1pl':'διδώμεθα', '2pl':'διδῶσθε', '3pl':'διδῶνται' },
      'pres.mp.opt': { '1sg':'διδοίμην', '2sg':'διδοῖο', '3sg':'διδοῖτο', '1pl':'διδοίμεθα', '2pl':'διδοῖσθε', '3pl':'διδοῖντο' },
      'pres.mp.imper': { '2sg':['δίδοσο','δίδου'], '3sg':'διδόσθω', '2pl':'δίδοσθε', '3pl':'διδόσθων' },
      'fut.act.opt': { '1sg':'δώσοιμι', '2sg':'δώσοις', '3sg':'δώσοι', '1pl':'δώσοιμεν', '2pl':'δώσοιτε', '3pl':'δώσοιεν' },
      'fut.mid.opt': { '1sg':'δωσοίμην', '2sg':'δώσοιο', '3sg':'δώσοιτο', '1pl':'δωσοίμεθα', '2pl':'δώσοισθε', '3pl':'δώσοιντο' },
      'fut.pass.opt': { '1sg':'δοθησοίμην', '2sg':'δοθήσοιο', '3sg':'δοθήσοιτο', '1pl':'δοθησοίμεθα', '2pl':'δοθήσοισθε', '3pl':'δοθήσοιντο' },
      'aor.act.subj': { '1sg':'δῶ', '2sg':'δῷς', '3sg':['δῷ','δώῃ','δοῖ'], '1pl':'δῶμεν', '2pl':'δῶτε', '3pl':'δῶσι(ν)' },
      'aor.act.opt': { '1sg':'δοίην', '2sg':['δοίης','δῴης'], '3sg':['δοίη','δῴη'], '1pl':['δοῖμεν','δοίημεν'], '2pl':['δοῖτε','δοίητε'], '3pl':['δοῖεν','δοίησαν'] },
      'aor.act.imper': { '2sg':'δός', '3sg':'δότω', '2pl':'δότε', '3pl':'δόντων' },
      'aor.mid.subj': { '1sg':'δῶμαι', '2sg':'δῷ', '3sg':'δῶται', '1pl':'δώμεθα', '2pl':'δῶσθε', '3pl':'δῶνται' },
      'aor.mid.opt': { '1sg':'δοίμην', '2sg':'δοῖο', '3sg':'δοῖτο', '1pl':'δοίμεθα', '2pl':'δοῖσθε', '3pl':'δοῖντο' },
      'aor.mid.imper': { '2sg':'δοῦ', '3sg':'δόσθω', '2pl':'δόσθε', '3pl':'δόσθων' },
      'aor.pass.subj': { '1sg':'δοθῶ', '2sg':'δοθῇς', '3sg':'δοθῇ', '1pl':'δοθῶμεν', '2pl':'δοθῆτε', '3pl':'δοθῶσι(ν)' },
      'aor.pass.opt': { '1sg':'δοθείην', '2sg':'δοθείης', '3sg':'δοθείη', '1pl':['δοθεῖμεν','δοθείημεν'], '2pl':['δοθεῖτε','δοθείητε'], '3pl':['δοθεῖεν','δοθείησαν'] },
      'aor.pass.imper': { '2sg':'δόθητι', '3sg':'δοθήτω', '2pl':'δόθητε', '3pl':'δοθέντων' },   // -τι, not the oracle's -θι; see above
      'pres.act.inf': { inf:'διδόναι' },
      'pres.mp.inf': { inf:'δίδοσθαι' },
      'fut.act.inf': { inf:'δώσειν' },
      'fut.mid.inf': { inf:'δώσεσθαι' },
      'fut.pass.inf': { inf:'δοθήσεσθαι' },
      'aor.act.inf': { inf:'δοῦναι' },
      'aor.mid.inf': { inf:'δόσθαι' },
      'aor.pass.inf': { inf:'δοθῆναι' },
      'perf.act.inf': { inf:'δεδωκέναι' },
      'perf.mp.inf': { inf:'δεδόσθαι' },
      /* Back in the deck 2026-08-23, Karsten's call: the -μι verbs' perfect
         moods and future perfect return, while λύω's and the contract verbs'
         stay in data/greek-archive.js. His page prints none of these; the
         athematic paradigms are the ones he wants whole. */
      'futperf.mp': { '1sg':'δεδώσομαι', '2sg':['δεδώσῃ','δεδώσει'], '3sg':'δεδώσεται', '1pl':'δεδωσόμεθα', '2pl':'δεδώσεσθε', '3pl':'δεδώσονται' },
      'perf.act.subj': { '1sg':'δεδώκω', '2sg':'δεδώκῃς', '3sg':'δεδώκῃ', '1pl':'δεδώκωμεν', '2pl':'δεδώκητε', '3pl':'δεδώκωσι(ν)' },
      'perf.act.opt': { '1sg':['δεδώκοιμι','δεδωκοίην'], '2sg':['δεδώκοις','δεδωκοίης'], '3sg':['δεδώκοι','δεδωκοίη'], '1pl':'δεδώκοιμεν', '2pl':'δεδώκοιτε', '3pl':'δεδώκοιεν' },
      'perf.act.imper': { '2sg':'δέδωκε', '3sg':'δεδωκέτω', '2pl':'δεδώκετε', '3pl':'δεδωκόντων' },
      'perf.mp.subj': { '1sg':'δεδομένος ὦ', '2sg':'δεδομένος ᾖς', '3sg':'δεδομένος ᾖ', '1pl':'δεδομένοι ὦμεν', '2pl':'δεδομένοι ἦτε', '3pl':'δεδομένοι ὦσι(ν)' },
      'perf.mp.opt': { '1sg':'δεδομένος εἴην', '2sg':'δεδομένος εἴης', '3sg':'δεδομένος εἴη', '1pl':['δεδομένοι εἴημεν','δεδομένοι εἶμεν'], '2pl':['δεδομένοι εἴητε','δεδομένοι εἶτε'], '3pl':['δεδομένοι εἴησαν','δεδομένοι εἶεν'] },
      'perf.mp.imper': { '2sg':'δέδοσο', '3sg':'δεδόσθω', '2pl':'δέδοσθε', '3pl':'δεδόσθων' },
      'futperf.mp.opt': { '1sg':'δεδωσοίμην', '2sg':'δεδώσοιο', '3sg':'δεδώσοιτο', '1pl':'δεδωσοίμεθα', '2pl':'δεδώσοισθε', '3pl':'δεδώσοιντο' },
      'futperf.mp.inf': { inf:'δεδώσεσθαι' }
    }
  },

  athematic_tithemi: {
    kind: 'verb', label: 'τίθημι (to put, place)', literal: true,
    subtitle: 'τίθημι, θήσω — to put, place',
    example: { lemma:'τίθημι', class:'athematic_tithemi', meaning:'to put, place' },
    categories: ['pres.act', 'pres.mp', 'impf.act', 'impf.mp', 'fut.act', 'fut.mid', 'fut.pass', 'aor.act', 'aor.mid', 'aor.pass', 'perf.act', 'perf.mp', 'plup.act', 'plup.mp', 'pres.act.subj', 'pres.act.opt', 'pres.act.imper', 'pres.mp.subj', 'pres.mp.opt', 'pres.mp.imper', 'fut.act.opt', 'fut.mid.opt', 'fut.pass.opt', 'aor.act.subj', 'aor.act.opt', 'aor.act.imper', 'aor.mid.subj', 'aor.mid.opt', 'aor.mid.imper', 'aor.pass.subj', 'aor.pass.opt', 'aor.pass.imper', 'perf.act.subj', 'perf.act.opt', 'perf.act.imper', 'perf.mp.subj', 'perf.mp.opt', 'perf.mp.imper', 'pres.act.inf', 'pres.mp.inf', 'fut.act.inf', 'fut.mid.inf', 'fut.pass.inf', 'aor.act.inf', 'aor.mid.inf', 'aor.pass.inf', 'perf.act.inf', 'perf.mp.inf'],
    cellKeys: ['1sg','2sg','3sg','1pl','2pl','3pl'],
    endings: {
      'pres.act': { '1sg':'τίθημι', '2sg':'τίθης',  '3sg':'τίθησι(ν)', '1pl':'τίθεμεν',  '2pl':'τίθετε',  '3pl':'τιθέασι(ν)' },
      'pres.mp':  { '1sg':'τίθεμαι','2sg':'τίθεσαι','3sg':'τίθεται',   '1pl':'τιθέμεθα', '2pl':'τίθεσθε', '3pl':'τίθενται' },
      'impf.act': { '1sg':'ἐτίθην', '2sg':'ἐτίθεις','3sg':'ἐτίθει',    '1pl':'ἐτίθεμεν', '2pl':'ἐτίθετε', '3pl':'ἐτίθεσαν' },
      'impf.mp':  { '1sg':'ἐτιθέμην','2sg':'ἐτίθεσο','3sg':'ἐτίθετο', '1pl':'ἐτιθέμεθα','2pl':'ἐτίθεσθε','3pl':'ἐτίθεντο' },
      'fut.act':  { '1sg':'θήσω',   '2sg':'θήσεις', '3sg':'θήσει',    '1pl':'θήσομεν',  '2pl':'θήσετε',  '3pl':'θήσουσι(ν)' },

      // ---- aorist and perfect systems (closes HANDOFF open item 3) ----
      'aor.act': { '1sg':'ἔθηκα', '2sg':'ἔθηκας', '3sg':'ἔθηκε(ν)', '1pl':['ἔθεμεν','ἐθήκαμεν'], '2pl':['ἔθετε','ἐθήκατε'], '3pl':['ἔθεσαν','ἔθηκαν'] },
      'aor.mid': { '1sg':['ἐθέμην','ἐθηκάμην'], '2sg':['ἔθου','ἐθήκω'], '3sg':['ἔθετο','ἐθήκατο'], '1pl':['ἐθέμεθα','ἐθηκάμεθα'], '2pl':['ἔθεσθε','ἐθήκασθε'], '3pl':['ἔθεντο','ἐθήκαντο'] },
      'aor.pass': { '1sg':'ἐτέθην', '2sg':'ἐτέθης', '3sg':'ἐτέθη', '1pl':'ἐτέθημεν', '2pl':'ἐτέθητε', '3pl':'ἐτέθησαν' },
      'perf.act': { '1sg':['τέθηκα','τέθεικα'], '2sg':['τέθηκας','τέθεικας'], '3sg':['τέθηκε(ν)','τέθεικε(ν)'], '1pl':['τεθήκαμεν','τεθείκαμεν'], '2pl':['τεθήκατε','τεθείκατε'], '3pl':['τεθήκασι(ν)','τεθείκασι(ν)'] },
      'perf.mp': { '1sg':'τέθειμαι', '2sg':'τέθεισαι', '3sg':'τέθειται', '1pl':'τεθείμεθα', '2pl':'τέθεισθε', '3pl':'τέθεινται' },
      // The τεθηκ- pluperfect was missing while the τεθηκ- PERFECT was already
      // accepted just above -- so ἐτεθήκη, built on a perfect this class calls
      // right, was marked wrong. Found by the appendix coverage check (test 33),
      // which prints τέθηκα/ἐτεθήκη throughout on p.344; the inconsistency was
      // invisible to the Wiktionary verifier because both sides read one table.
      'plup.act': { '1sg':['ἐτεθείκειν','ἐτεθείκη','ἐτεθήκη'], '2sg':['ἐτεθείκεις','ἐτεθείκης','ἐτεθήκης'], '3sg':['ἐτεθείκει(ν)','ἐτεθήκει(ν)'], '1pl':['ἐτεθείκεμεν','ἐτεθήκεμεν'], '2pl':['ἐτεθείκετε','ἐτεθήκετε'], '3pl':['ἐτεθείκεσαν','ἐτεθήκεσαν'] },
      'plup.mp': { '1sg':'ἐτεθείμην', '2sg':'ἐτέθεισο', '3sg':'ἐτέθειτο', '1pl':'ἐτεθείμεθα', '2pl':'ἐτέθεισθε', '3pl':'ἐτέθειντο' },

      /* ---- the non-indicative moods and the infinitives ----
         The future middle and future passive arrive with them, since an
         optative cannot sit on a tense whose indicative is absent.

         The perfect keeps the τεθηκ- / τεθεικ- doublet its indicative
         already carries, through every mood.

         aor.pass.imper 2sg is τέθητι against Wiktionary's τέθηθι -- the same
         dissimilation of -θι to -τι after -θη- as δίδωμι, and the same two
         verbs are the only ones the oracle treats differently. See
         ADJUDICATED in tools/verify/verify_greek.py. ---- */
      'fut.mid': { '1sg':'θήσομαι', '2sg':['θήσῃ','θήσει'], '3sg':'θήσεται', '1pl':'θησόμεθα', '2pl':'θήσεσθε', '3pl':'θήσονται' },
      'fut.pass': { '1sg':'τεθήσομαι', '2sg':['τεθήσῃ','τεθήσει'], '3sg':'τεθήσεται', '1pl':'τεθησόμεθα', '2pl':'τεθήσεσθε', '3pl':'τεθήσονται' },
      'pres.act.subj': { '1sg':'τιθῶ', '2sg':'τιθῇς', '3sg':'τιθῇ', '1pl':'τιθῶμεν', '2pl':'τιθῆτε', '3pl':'τιθῶσι(ν)' },
      'pres.act.opt': { '1sg':['τιθείην','τιθεῖμι'], '2sg':['τιθείης','τιθεῖς'], '3sg':['τιθείη','τιθεῖ'], '1pl':['τιθεῖμεν','τιθείημεν'], '2pl':['τιθεῖτε','τιθείητε'], '3pl':['τιθεῖεν','τιθείησαν'] },
      'pres.act.imper': { '2sg':'τίθει', '3sg':'τιθέτω', '2pl':'τίθετε', '3pl':'τιθέντων' },
      'pres.mp.subj': { '1sg':'τιθῶμαι', '2sg':'τιθῇ', '3sg':'τιθῆται', '1pl':'τιθώμεθα', '2pl':'τιθῆσθε', '3pl':'τιθῶνται' },
      'pres.mp.opt': { '1sg':'τιθείμην', '2sg':'τιθεῖο', '3sg':['τιθεῖτο','τιθοῖτο'], '1pl':['τιθείμεθα','τιθοίμεθα'], '2pl':['τιθεῖσθε','τιθοῖσθε'], '3pl':['τιθεῖντο','τιθοῖντο'] },
      'pres.mp.imper': { '2sg':['τίθεσο','τίθου'], '3sg':'τιθέσθω', '2pl':'τίθεσθε', '3pl':'τιθέσθων' },
      'fut.act.opt': { '1sg':'θήσοιμι', '2sg':'θήσοις', '3sg':'θήσοι', '1pl':'θήσοιμεν', '2pl':'θήσοιτε', '3pl':'θήσοιεν' },
      'fut.mid.opt': { '1sg':'θησοίμην', '2sg':'θήσοιο', '3sg':'θήσοιτο', '1pl':'θησοίμεθα', '2pl':'θήσοισθε', '3pl':'θήσοιντο' },
      'fut.pass.opt': { '1sg':'τεθησοίμην', '2sg':'τεθήσοιο', '3sg':'τεθήσοιτο', '1pl':'τεθησοίμεθα', '2pl':'τεθήσοισθε', '3pl':'τεθήσοιντο' },
      'aor.act.subj': { '1sg':'θῶ', '2sg':'θῇς', '3sg':'θῇ', '1pl':'θῶμεν', '2pl':'θῆτε', '3pl':'θῶσι(ν)' },
      'aor.act.opt': { '1sg':['θείην','θεῖμι'], '2sg':['θείης','θεῖς'], '3sg':['θείη','θεῖ'], '1pl':['θεῖμεν','θείημεν'], '2pl':['θεῖτε','θείητε'], '3pl':['θεῖεν','θείησαν'] },
      'aor.act.imper': { '2sg':'θές', '3sg':'θέτω', '2pl':'θέτε', '3pl':'θέντων' },
      'aor.mid.subj': { '1sg':'θῶμαι', '2sg':'θῇ', '3sg':'θῆται', '1pl':'θώμεθα', '2pl':'θῆσθε', '3pl':'θῶνται' },
      'aor.mid.opt': { '1sg':'θείμην', '2sg':'θεῖο', '3sg':['θεῖτο','θοῖτο'], '1pl':'θείμεθα', '2pl':'θεῖσθε', '3pl':'θεῖντο' },
      'aor.mid.imper': { '2sg':'θοῦ', '3sg':'θέσθω', '2pl':'θέσθε', '3pl':'θέσθων' },
      'aor.pass.subj': { '1sg':'τεθῶ', '2sg':'τεθῇς', '3sg':'τεθῇ', '1pl':'τεθῶμεν', '2pl':'τεθῆτε', '3pl':'τεθῶσι(ν)' },
      'aor.pass.opt': { '1sg':'τεθείην', '2sg':'τεθείης', '3sg':'τεθείη', '1pl':['τεθεῖμεν','τεθείημεν'], '2pl':['τεθεῖτε','τεθείητε'], '3pl':['τεθεῖεν','τεθείησαν'] },
      'aor.pass.imper': { '2sg':'τέθητι', '3sg':'τεθήτω', '2pl':'τέθητε', '3pl':'τεθέντων' },   // -τι, not the oracle's -θι; see above
      'pres.act.inf': { inf:'τιθέναι' },
      'pres.mp.inf': { inf:'τίθεσθαι' },
      'fut.act.inf': { inf:'θήσειν' },
      'fut.mid.inf': { inf:'θήσεσθαι' },
      'fut.pass.inf': { inf:'τεθήσεσθαι' },
      'aor.act.inf': { inf:'θεῖναι' },
      'aor.mid.inf': { inf:'θέσθαι' },
      'aor.pass.inf': { inf:'τεθῆναι' },
      'perf.act.inf': { inf:['τεθηκέναι','τεθεικέναι'] },
      'perf.mp.inf': { inf:'τεθεῖσθαι' },
      /* Back in the deck 2026-08-23, Karsten's call: the -μι verbs' perfect
         moods and future perfect return, while λύω's and the contract verbs'
         stay in data/greek-archive.js. His page prints none of these; the
         athematic paradigms are the ones he wants whole. */
      'perf.act.subj': { '1sg':['τεθήκω','τεθείκω'], '2sg':['τεθήκῃς','τεθείκῃς'], '3sg':['τεθήκῃ','τεθείκῃ'], '1pl':['τεθήκωμεν','τεθείκωμεν'], '2pl':['τεθήκητε','τεθείκητε'], '3pl':['τεθήκωσι(ν)','τεθείκωσι(ν)'] },
      'perf.act.opt': { '1sg':['τεθήκοιμι','τεθηκοίην','τεθείκοιμι','τεθεικοίην'], '2sg':['τεθήκοις','τεθηκοίης','τεθείκοις','τεθεικοίης'], '3sg':['τεθήκοι','τεθηκοίη','τεθείκοι','τεθεικοίη'], '1pl':['τεθήκοιμεν','τεθείκοιμεν'], '2pl':['τεθήκοιτε','τεθείκοιτε'], '3pl':['τεθήκοιεν','τεθείκοιεν'] },
      'perf.act.imper': { '2sg':['τέθηκε','τέθεικε'], '3sg':['τεθηκέτω','τεθεικέτω'], '2pl':['τεθήκετε','τεθείκετε'], '3pl':['τεθηκόντων','τεθεικόντων'] },
      'perf.mp.subj': { '1sg':'τεθειμένος ὦ', '2sg':'τεθειμένος ᾖς', '3sg':'τεθειμένος ᾖ', '1pl':'τεθειμένοι ὦμεν', '2pl':'τεθειμένοι ἦτε', '3pl':'τεθειμένοι ὦσι(ν)' },
      'perf.mp.opt': { '1sg':'τεθειμένος εἴην', '2sg':'τεθειμένος εἴης', '3sg':'τεθειμένος εἴη', '1pl':['τεθειμένοι εἴημεν','τεθειμένοι εἶμεν'], '2pl':['τεθειμένοι εἴητε','τεθειμένοι εἶτε'], '3pl':['τεθειμένοι εἴησαν','τεθειμένοι εἶεν'] },
      'perf.mp.imper': { '2sg':'τέθεισο', '3sg':'τεθείσθω', '2pl':'τέθεισθε', '3pl':'τεθείσθων' }
    }
  },

  athematic_histemi: {
    kind: 'verb', label: 'ἵστημι (to make stand)', literal: true,
    subtitle: 'ἵστημι, στήσω — to make stand, set up',
    example: { lemma:'ἵστημι', class:'athematic_histemi', meaning:'to make stand, set up' },
    // note (worth knowing, not modeled separately): ἵστημι is transitive
    // ("set up") in the present/imperfect/future/1st-aorist active shown
    // here, but functions intransitively ("stand") in its 2nd aorist and
    // perfect -- those tenses are out of v1 scope anyway (see above).
    categories: ['pres.act', 'pres.mp', 'impf.act', 'impf.mp', 'fut.act', 'fut.mid', 'fut.pass', 'aor.act', 'aor.mid', 'aor.pass', 'perf.act', 'perf.mp', 'plup.act', 'futperf.act', 'futperf.mp', 'pres.act.subj', 'pres.act.opt', 'pres.act.imper', 'pres.mp.subj', 'pres.mp.opt', 'pres.mp.imper', 'fut.act.opt', 'fut.mid.opt', 'fut.pass.opt', 'aor.act.subj', 'aor.act.opt', 'aor.act.imper', 'aor.mid.subj', 'aor.mid.opt', 'aor.mid.imper', 'aor.pass.subj', 'aor.pass.opt', 'aor.pass.imper', 'perf.act.subj', 'perf.act.opt', 'perf.act.imper', 'perf.mp.subj', 'perf.mp.opt', 'perf.mp.imper', 'futperf.act.opt', 'futperf.mp.opt', 'pres.act.inf', 'pres.mp.inf', 'fut.act.inf', 'fut.mid.inf', 'fut.pass.inf', 'aor.act.inf', 'aor.mid.inf', 'aor.pass.inf', 'perf.act.inf', 'perf.mp.inf', 'futperf.act.inf', 'futperf.mp.inf'],
    cellKeys: ['1sg','2sg','3sg','1pl','2pl','3pl'],
    endings: {
      'pres.act': { '1sg':'ἵστημι', '2sg':'ἵστης',  '3sg':'ἵστησι(ν)', '1pl':'ἵσταμεν',  '2pl':'ἵστατε',  '3pl':'ἱστᾶσι(ν)' },
      'pres.mp':  { '1sg':'ἵσταμαι','2sg':'ἵστασαι','3sg':'ἵσταται',   '1pl':'ἱστάμεθα', '2pl':'ἵστασθε', '3pl':'ἵστανται' },
      'impf.act': { '1sg':'ἵστην',  '2sg':'ἵστης',  '3sg':'ἵστη',      '1pl':'ἵσταμεν',  '2pl':'ἵστατε',  '3pl':'ἵστασαν' },
      'impf.mp':  { '1sg':'ἱστάμην','2sg':'ἵστασο', '3sg':'ἵστατο',    '1pl':'ἱστάμεθα', '2pl':'ἵστασθε', '3pl':'ἵσταντο' },
      'fut.act':  { '1sg':'στήσω',  '2sg':'στήσεις','3sg':'στήσει',    '1pl':'στήσομεν', '2pl':'στήσετε', '3pl':'στήσουσι(ν)' },

      // ---- aorist and perfect systems (closes HANDOFF open item 3) ----
      'aor.act': { '1sg':['ἔστησα','ἔστην'], '2sg':['ἔστησας','ἔστης'], '3sg':['ἔστησε(ν)','ἔστη'], '1pl':['ἐστήσαμεν','ἔστημεν'], '2pl':['ἐστήσατε','ἔστητε'], '3pl':'ἔστησαν' },
      'aor.mid': { '1sg':['ἐστησάμην','ἐστάμην'], '2sg':['ἐστήσω','ἔστω'], '3sg':['ἐστήσατο','ἔστατο'], '1pl':['ἐστησάμεθα','ἐστάμεθα'], '2pl':['ἐστήσασθε','ἔστασθε'], '3pl':['ἐστήσαντο','ἔσταντο'] },
      'aor.pass': { '1sg':'ἐστάθην', '2sg':'ἐστάθης', '3sg':'ἐστάθη', '1pl':'ἐστάθημεν', '2pl':'ἐστάθητε', '3pl':'ἐστάθησαν' },
      'perf.act': { '1sg':['ἕστακα','ἕστηκα'], '2sg':['ἕστακας','ἕστηκας'], '3sg':['ἕστακε(ν)','ἕστηκε(ν)'], '1pl':['ἑστάκαμεν','ἑστήκαμεν','ἕσταμεν'], '2pl':['ἑστάκατε','ἑστήκατε','ἕστατε'], '3pl':['ἑστάκασι(ν)','ἑστήκασι(ν)','ἑστᾶσι(ν)'] },
      'perf.mp': { '1sg':'ἕσταμαι', '2sg':'ἕστασαι', '3sg':'ἕσταται', '1pl':'ἑστάμεθα', '2pl':'ἕστασθε', '3pl':'ἕστανται' },
      'plup.act': { '1sg':['εἱστήκειν','εἱστήκη'], '2sg':['εἱστήκεις','εἱστήκης'], '3sg':'εἱστήκει(ν)', '1pl':['εἱστήκεμεν','ἕσταμεν'], '2pl':['εἱστήκετε','ἕστατε'], '3pl':['εἱστήκεσαν','ἕστασαν'] },

      /* ---- the non-indicative moods and the infinitives ----
         ἵστημι is two verbs wearing one lemma, and the moods make that
         visible in a way the indicative alone did not: στῆσον is 'set it up'
         and στῆθι is 'stand', στῆσαι and στῆναι likewise. Both are stored in
         every affected cell, transitive first to match the indicative's own
         ἔστησα, and either is accepted.

         The perfect keeps all three stems of its indicative -- ἑστακ-,
         ἑστηκ- and the short ἑστ- -- through every mood.

         The future perfect ἑστήξω ('I shall stand') arrives here too: the
         moods needed its indicative underneath them, so it came with them. ---- */
      'fut.mid': { '1sg':'στήσομαι', '2sg':['στήσῃ','στήσει'], '3sg':'στήσεται', '1pl':'στησόμεθα', '2pl':'στήσεσθε', '3pl':'στήσονται' },
      'fut.pass': { '1sg':'σταθήσομαι', '2sg':['σταθήσῃ','σταθήσει'], '3sg':'σταθήσεται', '1pl':'σταθησόμεθα', '2pl':'σταθήσεσθε', '3pl':'σταθήσονται' },
      'pres.act.subj': { '1sg':'ἱστῶ', '2sg':'ἱστῇς', '3sg':'ἱστῇ', '1pl':'ἱστῶμεν', '2pl':'ἱστῆτε', '3pl':'ἱστῶσι(ν)' },
      'pres.act.opt': { '1sg':['ἱσταίην','ἱσταῖμι'], '2sg':['ἱσταίης','ἱσταῖς'], '3sg':['ἱσταίη','ἱσταῖ'], '1pl':['ἱσταῖμεν','ἱσταίημεν'], '2pl':['ἱσταῖτε','ἱσταίητε'], '3pl':['ἱσταῖεν','ἱσταίησαν'] },
      'pres.act.imper': { '2sg':'ἵστη', '3sg':'ἱστάτω', '2pl':'ἵστατε', '3pl':'ἱστάντων' },
      'pres.mp.subj': { '1sg':'ἱστῶμαι', '2sg':'ἱστῇ', '3sg':'ἱστῆται', '1pl':'ἱστώμεθα', '2pl':'ἱστῆσθε', '3pl':'ἱστῶνται' },
      'pres.mp.opt': { '1sg':'ἱσταίμην', '2sg':'ἵσταιο', '3sg':'ἵσταιτο', '1pl':'ἱσταίμεθα', '2pl':'ἵσταισθε', '3pl':'ἵσταιντο' },
      'pres.mp.imper': { '2sg':['ἵστασο','ἵστω'], '3sg':'ἱστάσθω', '2pl':'ἵστασθε', '3pl':'ἱστάσθων' },
      'fut.act.opt': { '1sg':'στήσοιμι', '2sg':'στήσοις', '3sg':'στήσοι', '1pl':'στήσοιμεν', '2pl':'στήσοιτε', '3pl':'στήσοιεν' },
      'fut.mid.opt': { '1sg':'στησοίμην', '2sg':'στήσοιο', '3sg':'στήσοιτο', '1pl':'στησοίμεθα', '2pl':'στήσοισθε', '3pl':'στήσοιντο' },
      'fut.pass.opt': { '1sg':'σταθησοίμην', '2sg':'σταθήσοιο', '3sg':'σταθήσοιτο', '1pl':'σταθησοίμεθα', '2pl':'σταθήσοισθε', '3pl':'σταθήσοιντο' },
      'aor.act.subj': { '1sg':['στήσω','στῶ'], '2sg':['στήσῃς','στῇς'], '3sg':['στήσῃ','στῇ'], '1pl':['στήσωμεν','στῶμεν'], '2pl':['στήσητε','στῆτε'], '3pl':['στήσωσι(ν)','στῶσι(ν)'] },
      'aor.act.opt': { '1sg':['στήσαιμι','σταίην','σταῖμι'], '2sg':['στήσειας','στήσαις','σταίης','σταῖς'], '3sg':['στήσειε(ν)','στήσαι','σταίη','σταῖ'], '1pl':['στήσαιμεν','σταῖμεν','σταίημεν'], '2pl':['στήσαιτε','σταῖτε','σταίητε'], '3pl':['στήσειαν','στήσαιεν','σταῖεν','σταίησαν'] },
      'aor.act.imper': { '2sg':['στῆσον','στῆθι'], '3sg':['στησάτω','στήτω'], '2pl':['στήσατε','στῆτε'], '3pl':['στησάντων','στάντων'] },
      'aor.mid.subj': { '1sg':['στήσωμαι','στῶμαι'], '2sg':['στήσῃ','στῇ'], '3sg':['στήσηται','στῆται'], '1pl':['στησώμεθα','στώμεθα'], '2pl':['στήσησθε','στῆσθε'], '3pl':['στήσωνται','στῶνται'] },
      'aor.mid.opt': { '1sg':['στησαίμην','σταίμην'], '2sg':['στήσαιο','σταῖο'], '3sg':['στήσαιτο','σταῖτο'], '1pl':['στησαίμεθα','σταίμεθα'], '2pl':['στήσαισθε','σταῖσθε'], '3pl':['στήσαιντο','σταῖντο'] },
      'aor.mid.imper': { '2sg':['στῆσαι','στῶ'], '3sg':['στησάσθω','στάσθω'], '2pl':['στήσασθε','στάσθε'], '3pl':['στησάσθων','στάσθων'] },
      'aor.pass.subj': { '1sg':'σταθῶ', '2sg':'σταθῇς', '3sg':'σταθῇ', '1pl':'σταθῶμεν', '2pl':'σταθῆτε', '3pl':'σταθῶσι(ν)' },
      'aor.pass.opt': { '1sg':'σταθείην', '2sg':'σταθείης', '3sg':'σταθείη', '1pl':['σταθεῖμεν','σταθείημεν'], '2pl':['σταθεῖτε','σταθείητε'], '3pl':['σταθεῖεν','σταθείησαν'] },
      'aor.pass.imper': { '2sg':'στάθητι', '3sg':'σταθήτω', '2pl':'στάθητε', '3pl':'σταθέντων' },
      'pres.act.inf': { inf:'ἱστάναι' },
      'pres.mp.inf': { inf:'ἵστασθαι' },
      'fut.act.inf': { inf:'στήσειν' },
      'fut.mid.inf': { inf:'στήσεσθαι' },
      'fut.pass.inf': { inf:'σταθήσεσθαι' },
      'aor.act.inf': { inf:['στῆσαι','στῆναι'] },
      'aor.mid.inf': { inf:['στήσασθαι','στάσθαι'] },
      'aor.pass.inf': { inf:'σταθῆναι' },
      'perf.act.inf': { inf:['ἑστακέναι','ἑστηκέναι','ἑστάναι'] },
      'perf.mp.inf': { inf:'ἑστάσθαι' },
      /* Back in the deck 2026-08-23, Karsten's call: the -μι verbs' perfect
         moods and future perfect return, while λύω's and the contract verbs'
         stay in data/greek-archive.js. His page prints none of these; the
         athematic paradigms are the ones he wants whole. */
      'futperf.act': { '1sg':'ἑστήξω', '2sg':'ἑστήξεις', '3sg':'ἑστήξει', '1pl':'ἑστήξομεν', '2pl':'ἑστήξετε', '3pl':'ἑστήξουσι(ν)' },
      'futperf.mp': { '1sg':'ἑστήξομαι', '2sg':['ἑστήξῃ','ἑστήξει'], '3sg':'ἑστήξεται', '1pl':'ἑστηξόμεθα', '2pl':'ἑστήξεσθε', '3pl':'ἑστήξονται' },
      'perf.act.subj': { '1sg':['ἑστάκω','ἑστήκω','ἑστῶ'], '2sg':['ἑστάκῃς','ἑστήκῃς','ἑστῇς'], '3sg':['ἑστάκῃ','ἑστήκῃ','ἑστῇ'], '1pl':['ἑστάκωμεν','ἑστήκωμεν','ἑστῶμεν'], '2pl':['ἑστάκητε','ἑστήκητε','ἑστῆτε'], '3pl':['ἑστάκωσι(ν)','ἑστήκωσι(ν)','ἑστῶσι(ν)'] },
      'perf.act.opt': { '1sg':['ἑστάκοιμι','ἑστακοίην','ἑστήκοιμι','ἑστηκοίην','ἑσταίην'], '2sg':['ἑστάκοις','ἑστακοίης','ἑστήκοις','ἑστηκοίης','ἑσταίης'], '3sg':['ἑστάκοι','ἑστακοίη','ἑστήκοι','ἑστηκοίη','ἑσταίη'], '1pl':['ἑστάκοιμεν','ἑστήκοιμεν','ἑσταῖμεν','ἑσταίημεν'], '2pl':['ἑστάκοιτε','ἑστήκοιτε','ἑσταῖτε','ἑσταίητε'], '3pl':['ἑστάκοιεν','ἑστήκοιεν','ἑσταῖεν','ἑσταίησαν'] },
      'perf.act.imper': { '2sg':['ἕστακε','ἕστηκε','ἕσταθι'], '3sg':['ἑστακέτω','ἑστηκέτω','ἑστάτω'], '2pl':['ἑστάκετε','ἑστήκετε','ἕστατε'], '3pl':['ἑστακόντων','ἑστηκόντων','ἑστάντων'] },
      'perf.mp.subj': { '1sg':'ἑσταμένος ὦ', '2sg':'ἑσταμένος ᾖς', '3sg':'ἑσταμένος ᾖ', '1pl':'ἑσταμένοι ὦμεν', '2pl':'ἑσταμένοι ἦτε', '3pl':'ἑσταμένοι ὦσι(ν)' },
      'perf.mp.opt': { '1sg':'ἑσταμένος εἴην', '2sg':'ἑσταμένος εἴης', '3sg':'ἑσταμένος εἴη', '1pl':['ἑσταμένοι εἴημεν','ἑσταμένοι εἶμεν'], '2pl':['ἑσταμένοι εἴητε','ἑσταμένοι εἶτε'], '3pl':['ἑσταμένοι εἴησαν','ἑσταμένοι εἶεν'] },
      'perf.mp.imper': { '2sg':'ἕστασο', '3sg':'ἑστάσθω', '2pl':'ἕστασθε', '3pl':'ἑστάσθων' },
      'futperf.act.opt': { '1sg':'ἑστήξοιμι', '2sg':'ἑστήξοις', '3sg':'ἑστήξοι', '1pl':'ἑστήξοιμεν', '2pl':'ἑστήξοιτε', '3pl':'ἑστήξοιεν' },
      'futperf.mp.opt': { '1sg':'ἑστηξοίμην', '2sg':'ἑστήξοιο', '3sg':'ἑστήξοιτο', '1pl':'ἑστηξοίμεθα', '2pl':'ἑστήξοισθε', '3pl':'ἑστήξοιντο' },
      'futperf.act.inf': { inf:'ἑστήξειν' },
      'futperf.mp.inf': { inf:'ἑστήξεσθαι' }
    }
  },

  athematic_hiemi: {
    kind: 'verb', label: 'ἵημι (to send, let go)', literal: true,
    subtitle: 'ἵημι, ἥσω — to send, let go',
    example: { lemma:'ἵημι', class:'athematic_hiemi', meaning:'to send, let go' },
    categories: ['pres.act', 'pres.mp', 'impf.act', 'impf.mp', 'fut.act', 'fut.mid', 'fut.pass', 'aor.act', 'aor.mid', 'aor.pass', 'perf.act', 'perf.mp', 'plup.act', 'plup.mp', 'pres.act.subj', 'pres.act.opt', 'pres.act.imper', 'pres.mp.subj', 'pres.mp.opt', 'pres.mp.imper', 'fut.act.opt', 'fut.mid.opt', 'fut.pass.opt', 'aor.act.subj', 'aor.act.opt', 'aor.act.imper', 'aor.mid.subj', 'aor.mid.opt', 'aor.mid.imper', 'aor.pass.subj', 'aor.pass.opt', 'aor.pass.imper', 'perf.act.subj', 'perf.act.opt', 'perf.act.imper', 'perf.mp.subj', 'perf.mp.opt', 'perf.mp.imper', 'pres.act.inf', 'pres.mp.inf', 'fut.act.inf', 'fut.mid.inf', 'fut.pass.inf', 'aor.act.inf', 'aor.mid.inf', 'aor.pass.inf', 'perf.act.inf', 'perf.mp.inf'],
    cellKeys: ['1sg','2sg','3sg','1pl','2pl','3pl'],
    endings: {
      'pres.act': { '1sg':'ἵημι', '2sg':'ἵης',  '3sg':'ἵησι(ν)', '1pl':'ἵεμεν',  '2pl':'ἵετε',  '3pl':'ἱᾶσι(ν)' },
      'pres.mp':  { '1sg':'ἵεμαι','2sg':'ἵεσαι','3sg':'ἵεται',   '1pl':'ἱέμεθα', '2pl':'ἵεσθε', '3pl':'ἵενται' },
      'impf.act': { '1sg':'ἵην',  '2sg':'ἵεις', '3sg':'ἵει(ν)',  '1pl':'ἵεμεν',  '2pl':'ἵετε',  '3pl':'ἵεσαν' },
      'impf.mp':  { '1sg':'ἱέμην','2sg':'ἵεσο', '3sg':'ἵετο',    '1pl':'ἱέμεθα', '2pl':'ἵεσθε', '3pl':'ἵεντο' },
      'fut.act':  { '1sg':'ἥσω',  '2sg':'ἥσεις','3sg':'ἥσει',    '1pl':'ἥσομεν', '2pl':'ἥσετε', '3pl':'ἥσουσι(ν)' },

      // ---- aorist and perfect systems (closes HANDOFF open item 3) ----
      'aor.act': { '1sg':['ἧκα','ἕηκα'], '2sg':['ἧκας','ἕηκας'], '3sg':['ἧκε(ν)','ἕηκε(ν)'], '1pl':['εἷμεν','ἥκαμεν','ἑήκαμεν'], '2pl':['εἷτε','ἥκατε','ἑήκατε'], '3pl':['εἷσαν','ἧκαν','ἕηκαν'] },
      'aor.mid': { '1sg':['εἵμην','ἡκάμην','ἑηκάμην'], '2sg':['εἷσο','ἥκω','ἑήκω'], '3sg':['εἷτο','ἥκατο','ἑήκατο'], '1pl':['εἵμεθα','ἡκάμεθα','ἑηκάμεθα'], '2pl':['εἷσθε','ἥκασθε','ἑήκασθε'], '3pl':['εἷντο','ἥκαντο','ἑήκαντο'] },
      'aor.pass': { '1sg':'εἵθην', '2sg':'εἵθης', '3sg':'εἵθη', '1pl':'εἵθημεν', '2pl':'εἵθητε', '3pl':'εἵθησαν' },
      'perf.act': { '1sg':['εἷκα','ἕωκα'], '2sg':['εἷκας','ἕωκας'], '3sg':['εἷκε(ν)','ἕωκε(ν)'], '1pl':['εἵκαμεν','ἑώκαμεν'], '2pl':['εἵκατε','ἑώκατε'], '3pl':['εἵκασι(ν)','ἑώκασι(ν)'] },
      'perf.mp': { '1sg':['εἷμαι','ἕωμαι'], '2sg':['εἷσαι','ἕωσαι'], '3sg':['εἷται','ἕωται'], '1pl':['εἵμεθα','ἑώμεθα'], '2pl':['εἷσθε','ἕωσθε'], '3pl':['εἷνται','ἕωνται'] },
      /* Added 2026-08-23: this class had a pluperfect MIDDLE/PASSIVE and no
         pluperfect active, alone among the -μι verbs. p.344 prints it.
         Its third plural is printed εἱκήεσαν, which is not a form -- the other
         five cells of the same column are εἵκη, εἵκης, εἵκει(ν), εἵκεμεν,
         εἵκετε, so the ending is -εσαν. The -ειν singulars follow the house
         pattern, as δηλόω's do. */
      'plup.act': { '1sg':['εἵκειν','εἵκη'], '2sg':['εἵκεις','εἵκης'], '3sg':'εἵκει(ν)', '1pl':'εἵκεμεν', '2pl':'εἵκετε', '3pl':'εἵκεσαν' },
      'plup.mp': { '1sg':'εἵμην', '2sg':'εἷσο', '3sg':'εἷτο', '1pl':'εἵμεθα', '2pl':'εἷσθε', '3pl':'εἷντο' },

      /* ---- the non-indicative moods and the infinitives ----
         ἕς, ἕτω, ἕτε, ἕντων beside δός and θές: the third of the three
         athematic aorist imperatives, and the one that is almost nothing but
         a breathing. Two of this verb's forms differ from a commoner word by
         a breathing alone -- the aorist infinitive εἷναι against εἶναι 'to
         be', and the present ἱέναι against εἶμι's ἰέναι 'to go'. Cotidie
         grades breathings always, so those are three different answers.

         The perfect keeps the εἱκ- / ἑωκ- doublet of its indicative through
         every mood. ---- */
      'fut.mid': { '1sg':'ἥσομαι', '2sg':['ἥσῃ','ἥσει'], '3sg':'ἥσεται', '1pl':'ἡσόμεθα', '2pl':'ἥσεσθε', '3pl':'ἥσονται' },
      'fut.pass': { '1sg':'ἑθήσομαι', '2sg':['ἑθήσῃ','ἑθήσει'], '3sg':'ἑθήσεται', '1pl':'ἑθησόμεθα', '2pl':'ἑθήσεσθε', '3pl':'ἑθήσονται' },
      'pres.act.subj': { '1sg':'ἱῶ', '2sg':'ἱῇς', '3sg':'ἱῇ', '1pl':'ἱῶμεν', '2pl':'ἱῆτε', '3pl':'ἱῶσι(ν)' },
      'pres.act.opt': { '1sg':['ἱείην','ἱεῖμι'], '2sg':['ἱείης','ἱεῖς'], '3sg':['ἱείη','ἱεῖ'], '1pl':['ἱεῖμεν','ἱείημεν'], '2pl':['ἱεῖτε','ἱείητε'], '3pl':['ἱεῖεν','ἱείησαν'] },
      'pres.act.imper': { '2sg':'ἵει', '3sg':'ἱέτω', '2pl':'ἵετε', '3pl':'ἱέντων' },
      'pres.mp.subj': { '1sg':'ἱῶμαι', '2sg':'ἱῇ', '3sg':'ἱῆται', '1pl':'ἱώμεθα', '2pl':'ἱῆσθε', '3pl':'ἱῶνται' },
      'pres.mp.opt': { '1sg':'ἱείμην', '2sg':'ἱεῖο', '3sg':['ἱεῖτο','ἱοῖτο'], '1pl':['ἱείμεθα','ἱοίμεθα'], '2pl':['ἱεῖσθε','ἱοῖσθε'], '3pl':['ἱεῖντο','ἱοῖντο'] },
      'pres.mp.imper': { '2sg':['ἵεσο','ἵου'], '3sg':'ἱέσθω', '2pl':'ἵεσθε', '3pl':'ἱέσθων' },
      'fut.act.opt': { '1sg':'ἥσοιμι', '2sg':'ἥσοις', '3sg':'ἥσοι', '1pl':'ἥσοιμεν', '2pl':'ἥσοιτε', '3pl':'ἥσοιεν' },
      'fut.mid.opt': { '1sg':'ἡσοίμην', '2sg':'ἥσοιο', '3sg':'ἥσοιτο', '1pl':'ἡσοίμεθα', '2pl':'ἥσοισθε', '3pl':'ἥσοιντο' },
      'fut.pass.opt': { '1sg':'ἑθησοίμην', '2sg':'ἑθήσοιο', '3sg':'ἑθήσοιτο', '1pl':'ἑθησοίμεθα', '2pl':'ἑθήσοισθε', '3pl':'ἑθήσοιντο' },
      'aor.act.subj': { '1sg':'ὧ', '2sg':'ᾗς', '3sg':['ᾗ','ᾗσι(ν)'], '1pl':'ὧμεν', '2pl':'ἧτε', '3pl':'ὧσι(ν)' },
      'aor.act.opt': { '1sg':['εἵην','εἷμι'], '2sg':['εἵης','εἷς'], '3sg':['εἵη','εἷ'], '1pl':['εἷμεν','εἵημεν'], '2pl':['εἷτε','εἵητε'], '3pl':['εἷεν','εἵησαν'] },
      'aor.act.imper': { '2sg':'ἕς', '3sg':'ἕτω', '2pl':'ἕτε', '3pl':'ἕντων' },
      'aor.mid.subj': { '1sg':'ὧμαι', '2sg':'ᾗ', '3sg':'ἧται', '1pl':'ὥμεθα', '2pl':'ἧσθε', '3pl':'ὧνται' },
      'aor.mid.opt': { '1sg':'εἵμην', '2sg':'εἷο', '3sg':['εἷτο','οἷτο'], '1pl':['εἵμεθα','οἵμεθα'], '2pl':['εἷσθε','οἷσθε'], '3pl':['εἷντο','οἷντο'] },
      'aor.mid.imper': { '2sg':'οὗ', '3sg':'ἕσθω', '2pl':'ἕσθε', '3pl':'ἕσθων' },
      'aor.pass.subj': { '1sg':'ἑθῶ', '2sg':'ἑθῇς', '3sg':'ἑθῇ', '1pl':'ἑθῶμεν', '2pl':'ἑθῆτε', '3pl':'ἑθῶσι(ν)' },
      'aor.pass.opt': { '1sg':'ἑθείην', '2sg':'ἑθείης', '3sg':'ἑθείη', '1pl':['ἑθεῖμεν','ἑθείημεν'], '2pl':['ἑθεῖτε','ἑθείητε'], '3pl':['ἑθεῖεν','ἑθείησαν'] },
      'aor.pass.imper': { '2sg':'ἕθητι', '3sg':'ἑθήτω', '2pl':'ἕθητε', '3pl':'ἑθέντων' },
      'pres.act.inf': { inf:'ἱέναι' },
      'pres.mp.inf': { inf:'ἵεσθαι' },
      'fut.act.inf': { inf:'ἥσειν' },
      'fut.mid.inf': { inf:'ἥσεσθαι' },
      'fut.pass.inf': { inf:'ἑθήσεσθαι' },
      'aor.act.inf': { inf:'εἷναι' },
      'aor.mid.inf': { inf:'ἕσθαι' },
      'aor.pass.inf': { inf:'ἑθῆναι' },
      'perf.act.inf': { inf:['εἱκέναι','ἑωκέναι'] },
      'perf.mp.inf': { inf:['εἷσθαι','ἑῶσθαι'] },
      /* Back in the deck 2026-08-23, Karsten's call: the -μι verbs' perfect
         moods and future perfect return, while λύω's and the contract verbs'
         stay in data/greek-archive.js. His page prints none of these; the
         athematic paradigms are the ones he wants whole. */
      'perf.act.subj': { '1sg':['εἵκω','ἑώκω'], '2sg':['εἵκῃς','ἑώκῃς'], '3sg':['εἵκῃ','ἑώκῃ'], '1pl':['εἵκωμεν','ἑώκωμεν'], '2pl':['εἵκητε','ἑώκητε'], '3pl':['εἵκωσι(ν)','ἑώκωσι(ν)'] },
      'perf.act.opt': { '1sg':['εἵκοιμι','εἱκοίην','ἑώκοιμι','ἑωκοίην'], '2sg':['εἵκοις','εἱκοίης','ἑώκοις','ἑωκοίης'], '3sg':['εἵκοι','εἱκοίη','ἑώκοι','ἑωκοίη'], '1pl':['εἵκοιμεν','ἑώκοιμεν'], '2pl':['εἵκοιτε','ἑώκοιτε'], '3pl':['εἵκοιεν','ἑώκοιεν'] },
      'perf.act.imper': { '2sg':['εἷκε','ἕωκε'], '3sg':['εἱκέτω','ἑωκέτω'], '2pl':['εἵκετε','ἑώκετε'], '3pl':['εἱκόντων','ἑωκόντων'] },
      'perf.mp.subj': { '1sg':['εἱμένος ὦ','ἑωμένος ὦ'], '2sg':['εἱμένος ᾖς','ἑωμένος ᾖς'], '3sg':['εἱμένος ᾖ','ἑωμένος ᾖ'], '1pl':['εἱμένοι ὦμεν','ἑωμένοι ὦμεν'], '2pl':['εἱμένοι ἦτε','ἑωμένοι ἦτε'], '3pl':['εἱμένοι ὦσι(ν)','ἑωμένοι ὦσι(ν)'] },
      'perf.mp.opt': { '1sg':['εἱμένος εἴην','ἑωμένος εἴην'], '2sg':['εἱμένος εἴης','ἑωμένος εἴης'], '3sg':['εἱμένος εἴη','ἑωμένος εἴη'], '1pl':['εἱμένοι εἴημεν','εἱμένοι εἶμεν','ἑωμένοι εἴημεν','ἑωμένοι εἶμεν'], '2pl':['εἱμένοι εἴητε','εἱμένοι εἶτε','ἑωμένοι εἴητε','ἑωμένοι εἶτε'], '3pl':['εἱμένοι εἴησαν','εἱμένοι εἶεν','ἑωμένοι εἴησαν','ἑωμένοι εἶεν'] },
      'perf.mp.imper': { '2sg':['εἷσο','ἕωσο'], '3sg':['εἵσθω','ἑώσθω'], '2pl':['εἷσθε','ἕωσθε'], '3pl':['εἵσθων','εἵσθωσαν','ἑώσθων'] },   // Attic -σθων shown first, as in every other class here; -σθωσαν is later
    }
  },

  athematic_deiknymi: {
    kind: 'verb', label: 'δείκνυμι (to show)', literal: true,
    subtitle: 'δείκνυμι, δείξω — to show',
    example: { lemma:'δείκνυμι', class:'athematic_deiknymi', meaning:'to show' },
    // the -νυμι sub-type -- morphologically more regular than the
    // reduplicating four above (no reduplication, stable stem δεικνυ-),
    // kept literal anyway for now since it's still the only word in its
    // class; a natural candidate to become a real root+ending formula
    // class once more -νυμι verbs are added. See HANDOFF.md.
    categories: ['pres.act', 'pres.mp', 'impf.act', 'impf.mp', 'fut.act', 'fut.mid', 'fut.pass', 'aor.act', 'aor.mid', 'aor.pass', 'perf.act', 'perf.mp', 'futperf.mp', 'pres.act.subj', 'pres.act.opt', 'pres.act.imper', 'pres.mp.subj', 'pres.mp.opt', 'pres.mp.imper', 'fut.act.opt', 'fut.mid.opt', 'fut.pass.opt', 'aor.act.subj', 'aor.act.opt', 'aor.act.imper', 'aor.mid.subj', 'aor.mid.opt', 'aor.mid.imper', 'aor.pass.subj', 'aor.pass.opt', 'aor.pass.imper', 'perf.act.subj', 'perf.act.opt', 'perf.act.imper', 'perf.mp.subj', 'perf.mp.opt', 'perf.mp.imper', 'futperf.mp.opt', 'pres.act.inf', 'pres.mp.inf', 'fut.act.inf', 'fut.mid.inf', 'fut.pass.inf', 'aor.act.inf', 'aor.mid.inf', 'aor.pass.inf', 'perf.act.inf', 'perf.mp.inf', 'futperf.mp.inf'],
    cellKeys: ['1sg','2sg','3sg','1pl','2pl','3pl'],
    endings: {
      'pres.act': { '1sg':'δείκνυμι', '2sg':'δείκνυς',  '3sg':'δείκνυσι(ν)', '1pl':'δείκνυμεν',  '2pl':'δείκνυτε',  '3pl':'δεικνύασι(ν)' },
      'pres.mp':  { '1sg':'δείκνυμαι','2sg':'δείκνυσαι','3sg':'δείκνυται',   '1pl':'δεικνύμεθα', '2pl':'δείκνυσθε', '3pl':'δείκνυνται' },
      'impf.act': { '1sg':'ἐδείκνυν', '2sg':'ἐδείκνυς', '3sg':'ἐδείκνυ',     '1pl':'ἐδείκνυμεν', '2pl':'ἐδείκνυτε', '3pl':'ἐδείκνυσαν' },
      'impf.mp':  { '1sg':'ἐδεικνύμην','2sg':'ἐδείκνυσο','3sg':'ἐδείκνυτο', '1pl':'ἐδεικνύμεθα','2pl':'ἐδείκνυσθε','3pl':'ἐδείκνυντο' },
      'fut.act':  { '1sg':'δείξω',    '2sg':'δείξεις',  '3sg':'δείξει',      '1pl':'δείξομεν',   '2pl':'δείξετε',   '3pl':'δείξουσι(ν)' },

      // ---- aorist and perfect systems (closes HANDOFF open item 3) ----
      'aor.act': { '1sg':'ἔδειξα', '2sg':'ἔδειξας', '3sg':'ἔδειξε(ν)', '1pl':'ἐδείξαμεν', '2pl':'ἐδείξατε', '3pl':'ἔδειξαν' },
      'aor.mid': { '1sg':'ἐδειξάμην', '2sg':'ἐδείξω', '3sg':'ἐδείξατο', '1pl':'ἐδειξάμεθα', '2pl':'ἐδείξασθε', '3pl':'ἐδείξαντο' },
      'aor.pass': { '1sg':'ἐδείχθην', '2sg':'ἐδείχθης', '3sg':'ἐδείχθη', '1pl':'ἐδείχθημεν', '2pl':'ἐδείχθητε', '3pl':'ἐδείχθησαν' },
      'perf.act': { '1sg':'δέδειχα', '2sg':'δέδειχας', '3sg':'δέδειχε(ν)', '1pl':'δεδείχαμεν', '2pl':'δεδείχατε', '3pl':'δεδείχασι(ν)' },
      'perf.mp': { '1sg':'δέδειγμαι', '2sg':'δέδειξαι', '3sg':'δέδεικται', '1pl':'δεδείγμεθα', '2pl':'δέδειχθε', '3pl':'δεδείκαται' },

      /* ---- the non-indicative moods and the infinitives ----
         The -νυμι sub-type conjugates its moods THEMATICALLY: δεικνύω,
         δεικνύοιμι, exactly λύω's endings on the stem δεικνυ-, where the
         other four -μι verbs have διδῶ and διδοίην. Only the indicative and
         the infinitive stay athematic (δείκνυμι, δεικνύναι). That is the one
         thing that most distinguishes this class from its neighbours, and
         until now the deck had no cell that showed it. ---- */
      'fut.mid': { '1sg':'δείξομαι', '2sg':['δείξῃ','δείξει'], '3sg':'δείξεται', '1pl':'δειξόμεθα', '2pl':'δείξεσθε', '3pl':'δείξονται' },
      'fut.pass': { '1sg':'δειχθήσομαι', '2sg':['δειχθήσῃ','δειχθήσει'], '3sg':'δειχθήσεται', '1pl':'δειχθησόμεθα', '2pl':'δειχθήσεσθε', '3pl':'δειχθήσονται' },
      'pres.act.subj': { '1sg':'δεικνύω', '2sg':'δεικνύῃς', '3sg':'δεικνύῃ', '1pl':'δεικνύωμεν', '2pl':'δεικνύητε', '3pl':'δεικνύωσι(ν)' },
      'pres.act.opt': { '1sg':'δεικνύοιμι', '2sg':'δεικνύοις', '3sg':'δεικνύοι', '1pl':'δεικνύοιμεν', '2pl':'δεικνύοιτε', '3pl':'δεικνύοιεν' },
      'pres.act.imper': { '2sg':'δείκνυ', '3sg':'δεικνύτω', '2pl':'δείκνυτε', '3pl':'δεικνύντων' },
      'pres.mp.subj': { '1sg':'δεικνύωμαι', '2sg':'δεικνύῃ', '3sg':'δεικνύηται', '1pl':'δεικνυώμεθα', '2pl':'δεικνύησθε', '3pl':'δεικνύωνται' },
      'pres.mp.opt': { '1sg':'δεικνυοίμην', '2sg':'δεικνύοιο', '3sg':'δεικνύοιτο', '1pl':'δεικνυοίμεθα', '2pl':'δεικνύοισθε', '3pl':'δεικνύοιντο' },
      'pres.mp.imper': { '2sg':'δείκνυσο', '3sg':'δεικνύσθω', '2pl':'δείκνυσθε', '3pl':'δεικνύσθων' },
      'fut.act.opt': { '1sg':'δείξοιμι', '2sg':'δείξοις', '3sg':'δείξοι', '1pl':'δείξοιμεν', '2pl':'δείξοιτε', '3pl':'δείξοιεν' },
      'fut.mid.opt': { '1sg':'δειξοίμην', '2sg':'δείξοιο', '3sg':'δείξοιτο', '1pl':'δειξοίμεθα', '2pl':'δείξοισθε', '3pl':'δείξοιντο' },
      'fut.pass.opt': { '1sg':'δειχθησοίμην', '2sg':'δειχθήσοιο', '3sg':'δειχθήσοιτο', '1pl':'δειχθησοίμεθα', '2pl':'δειχθήσοισθε', '3pl':'δειχθήσοιντο' },
      'aor.act.subj': { '1sg':'δείξω', '2sg':'δείξῃς', '3sg':'δείξῃ', '1pl':'δείξωμεν', '2pl':'δείξητε', '3pl':'δείξωσι(ν)' },
      'aor.act.opt': { '1sg':'δείξαιμι', '2sg':['δείξειας','δείξαις'], '3sg':['δείξειε(ν)','δείξαι'], '1pl':'δείξαιμεν', '2pl':'δείξαιτε', '3pl':['δείξειαν','δείξαιεν'] },
      'aor.act.imper': { '2sg':'δεῖξον', '3sg':'δειξάτω', '2pl':'δείξατε', '3pl':'δειξάντων' },
      'aor.mid.subj': { '1sg':'δείξωμαι', '2sg':'δείξῃ', '3sg':'δείξηται', '1pl':'δειξώμεθα', '2pl':'δείξησθε', '3pl':'δείξωνται' },
      'aor.mid.opt': { '1sg':'δειξαίμην', '2sg':'δείξαιο', '3sg':'δείξαιτο', '1pl':'δειξαίμεθα', '2pl':'δείξαισθε', '3pl':'δείξαιντο' },
      'aor.mid.imper': { '2sg':'δεῖξαι', '3sg':'δειξάσθω', '2pl':'δείξασθε', '3pl':'δειξάσθων' },
      'aor.pass.subj': { '1sg':'δειχθῶ', '2sg':'δειχθῇς', '3sg':'δειχθῇ', '1pl':'δειχθῶμεν', '2pl':'δειχθῆτε', '3pl':'δειχθῶσι(ν)' },
      'aor.pass.opt': { '1sg':'δειχθείην', '2sg':'δειχθείης', '3sg':'δειχθείη', '1pl':['δειχθεῖμεν','δειχθείημεν'], '2pl':['δειχθεῖτε','δειχθείητε'], '3pl':['δειχθεῖεν','δειχθείησαν'] },
      'aor.pass.imper': { '2sg':'δείχθητι', '3sg':'δειχθήτω', '2pl':'δείχθητε', '3pl':'δειχθέντων' },
      'pres.act.inf': { inf:'δεικνύναι' },
      'pres.mp.inf': { inf:'δείκνυσθαι' },
      'fut.act.inf': { inf:'δείξειν' },
      'fut.mid.inf': { inf:'δείξεσθαι' },
      'fut.pass.inf': { inf:'δειχθήσεσθαι' },
      'aor.act.inf': { inf:'δεῖξαι' },
      'aor.mid.inf': { inf:'δείξασθαι' },
      'aor.pass.inf': { inf:'δειχθῆναι' },
      'perf.act.inf': { inf:'δεδειχέναι' },
      'perf.mp.inf': { inf:'δεδεῖχθαι' },
      /* Back in the deck 2026-08-23, Karsten's call: the -μι verbs' perfect
         moods and future perfect return, while λύω's and the contract verbs'
         stay in data/greek-archive.js. His page prints none of these; the
         athematic paradigms are the ones he wants whole. */
      'futperf.mp': { '1sg':'δεδείξομαι', '2sg':['δεδείξῃ','δεδείξει'], '3sg':'δεδείξεται', '1pl':'δεδειξόμεθα', '2pl':'δεδείξεσθε', '3pl':'δεδείξονται' },
      'perf.act.subj': { '1sg':'δεδείχω', '2sg':'δεδείχῃς', '3sg':'δεδείχῃ', '1pl':'δεδείχωμεν', '2pl':'δεδείχητε', '3pl':'δεδείχωσι(ν)' },
      'perf.act.opt': { '1sg':['δεδείχοιμι','δεδειχοίην'], '2sg':['δεδείχοις','δεδειχοίης'], '3sg':['δεδείχοι','δεδειχοίη'], '1pl':'δεδείχοιμεν', '2pl':'δεδείχοιτε', '3pl':'δεδείχοιεν' },
      'perf.act.imper': { '2sg':'δέδειχε', '3sg':'δεδειχέτω', '2pl':'δεδείχετε', '3pl':'δεδειχόντων' },
      'perf.mp.subj': { '1sg':'δεδειγμένος ὦ', '2sg':'δεδειγμένος ᾖς', '3sg':'δεδειγμένος ᾖ', '1pl':'δεδειγμένοι ὦμεν', '2pl':'δεδειγμένοι ἦτε', '3pl':'δεδειγμένοι ὦσι(ν)' },
      'perf.mp.opt': { '1sg':'δεδειγμένος εἴην', '2sg':'δεδειγμένος εἴης', '3sg':'δεδειγμένος εἴη', '1pl':['δεδειγμένοι εἴημεν','δεδειγμένοι εἶμεν'], '2pl':['δεδειγμένοι εἴητε','δεδειγμένοι εἶτε'], '3pl':['δεδειγμένοι εἴησαν','δεδειγμένοι εἶεν'] },
      'perf.mp.imper': { '2sg':'δέδειξο', '3sg':'δεδείχθω', '2pl':'δέδειχθε', '3pl':'δεδείχθων' },
      'futperf.mp.opt': { '1sg':'δεδειξοίμην', '2sg':'δεδείξοιο', '3sg':'δεδείξοιτο', '1pl':'δεδειξοίμεθα', '2pl':'δεδείξοισθε', '3pl':'δεδείξοιντο' },
      'futperf.mp.inf': { inf:'δεδείξεσθαι' }
    }
  }
,

  /* ---- εἶμι, to go: the three athematic verbs the first build left out ----

     HANDOFF open item 6 records that φημί and εἶμι were deliberately skipped
     when the original six athematic verbs went in, because their imperfects
     are doublet-heavy enough to be dangerous; οἶδα was never considered. All
     three are here now, and all three needed hand adjudication that the other
     nine did not -- which is why they were right to be left until the
     pipeline was well-trodden rather than done first.

     εἶμι is present in form and FUTURE in meaning in Attic prose: "I shall
     go" is the standard sense, and it supplies ἔρχομαι's future. It has
     nothing but a present and an imperfect, so six categories in all.

     Three departures from the oracle's table, all recorded rather than
     silent:

     - The imperfect second singular comes back as `ᾔεισ(θα)`. Cotidie's
       parentheses mean ONE thing, the movable nu, and js/greek.js expands
       exactly the string "(ν)" and nothing else -- so storing that would
       have made the only accepted answer a string with a bracket in it and
       marked both ᾔεις and ᾔεισθα wrong. Written out as two forms. There is
       now a test that no form in either deck carries a parenthesis that is
       not a final (ν).

     - The imperfect third plural is offered as six forms. ᾖσαν, ᾔεσαν and
       ᾔεισαν are the Attic ones; εἶσαν is Homeric, and ᾖν and ἴν are neither.
       Kept to the three, on the deck's standing rule that a wider oracle
       masks errors rather than finding them.

     - The present infinitive is offered as ἰέναι, εἴναι, ἴναι. Only ἰέναι is
       Attic, and the other two are worse than merely superfluous here:
       Cotidie can be set to ignore accents, and with accents off εἴναι is
       indistinguishable from εἶναι, so accepting it would mark "to be" right
       as the infinitive of "to go". Kept to ἰέναι.

     Dropping alternatives cannot cause a verification mismatch -- the check
     is that our forms and theirs intersect -- so none of this is hidden by
     the "zero mismatches" line. It is written down instead. ---- */
  athematic_eimi_go: {
    kind: 'verb', label: 'εἶμι (to go)', literal: true,
    subtitle: 'εἶμι, ἰέναι — to go; in Attic prose, "I shall go"',
    example: { lemma:'εἶμι', class:'athematic_eimi_go', meaning:'to go, will go' },
    categories: [
      'pres.act',
      'impf.act',
      'pres.act.subj',
      'pres.act.opt',
      'pres.act.imper',
      'pres.act.inf'],
    cellKeys: ['1sg','2sg','3sg','1pl','2pl','3pl'],
    endings: {
      'pres.act': { '1sg':'εἶμι', '2sg':'εἶ', '3sg':'εἶσι(ν)', '1pl':'ἴμεν', '2pl':'ἴτε', '3pl':'ἴασι(ν)' },
      // 2sg written out: the oracle prints ᾔεισ(θα), and (…) here means the
      // movable nu and nothing else. 3pl kept to the three Attic forms.
      'impf.act': { '1sg':['ᾖα','ᾔειν'], '2sg':['ᾔεις','ᾔεισθα'], '3sg':'ᾔει(ν)', '1pl':['ᾖμεν','ᾔειμεν'], '2pl':['ᾖτε','ᾔειτε'], '3pl':['ᾖσαν','ᾔεσαν','ᾔεισαν'] },
      'pres.act.subj': { '1sg':'ἴω', '2sg':'ἴῃς', '3sg':'ἴῃ', '1pl':'ἴωμεν', '2pl':'ἴητε', '3pl':'ἴωσι(ν)' },
      'pres.act.opt': { '1sg':['ἴοιμι','ἰοίην'], '2sg':'ἴοις', '3sg':'ἴοι', '1pl':'ἴοιμεν', '2pl':'ἴοιτε', '3pl':'ἴοιεν' },
      'pres.act.imper': { '2sg':'ἴθι', '3sg':'ἴτω', '2pl':'ἴτε', '3pl':['ἰόντων','ἴτωσαν'] },
      // ἰέναι alone: see the note above about εἴναι and accent-insensitive grading.
      'pres.act.inf': { inf:'ἰέναι' }
    }
  }
,

  /* ---- φημί, to say ----
     The other verb HANDOFF open item 6 names as deliberately skipped. Its
     present indicative is ENCLITIC in every finite form but φῄς, which is why
     it is printed with an acute here and read without one in ὥς φησι.

     Two things a reader should know, both recorded rather than decided
     quietly:

     - The middle system (φάμαι, ἐφάμην, and the moods on them) is what
       Wiktionary's Attic table offers, and it is included on that basis, but
       φημί in Attic PROSE is essentially an active verb: ἔφατο is Homer's
       word, not Xenophon's. That is 66 cells of daily drilling for something
       Karsten will not need to produce. Flagged in NEXT_SESSION.md as his
       call rather than removed here, because the oracle attests them and
       narrowing the deck on a judgement is not a decision to take silently.

     - The imperfect third singular is offered as ἔφη(ν). That bracket is a
       VARIANT, not the movable nu -- and the variant it offers, ἔφην, is
       this verb's FIRST singular, so accepting it would mark "I said" right
       as the answer to "he said". Kept to ἔφη, which is also what a textbook
       prints.

     Wiktionary's own usage note adds a third thing worth knowing and worth
     NOT modelling: for the imperfect active, ἔφασκον from φάσκω was
     generally used instead. That is a fact about which verb to reach for,
     not about this paradigm. ---- */
  athematic_phemi: {
    kind: 'verb', label: 'φημί (to say)', literal: true,
    subtitle: 'φημί, φήσω, ἔφησα — to say, assert',
    example: { lemma:'φημί', class:'athematic_phemi', meaning:'to say' },
    categories: ['pres.act', 'pres.mp', 'impf.act', 'impf.mid', 'fut.act', 'fut.mid', 'aor.act', 'perf.mp', 'pres.act.subj', 'pres.act.opt', 'pres.act.imper', 'pres.mp.subj', 'pres.mp.opt', 'pres.mp.imper', 'fut.act.opt', 'fut.mid.opt', 'aor.act.subj', 'aor.act.opt', 'aor.act.imper', 'perf.mp.subj', 'perf.mp.opt', 'perf.mp.imper', 'pres.act.inf', 'pres.mp.inf', 'fut.act.inf', 'fut.mid.inf', 'aor.act.inf', 'perf.mp.inf'],
    cellKeys: ['1sg','2sg','3sg','1pl','2pl','3pl'],
    endings: {
      'pres.act': { '1sg':'φημί', '2sg':'φῄς', '3sg':'φησί(ν)', '1pl':'φαμέν', '2pl':'φατέ', '3pl':'φασί(ν)' },
      'pres.mp': { '1sg':'φάμαι', '2sg':'φάσαι', '3sg':'φάται', '1pl':'φάμεθα', '2pl':'φάσθε', '3pl':'φάνται' },
      'impf.act': { '1sg':'ἔφην', '2sg':['ἔφης','ἔφησθα'], '3sg':'ἔφη', '1pl':'ἔφαμεν', '2pl':'ἔφατε', '3pl':['ἔφασαν','ἔφαν'] },
      'impf.mid': { '1sg':'ἐφάμην', '2sg':'ἔφασο', '3sg':'ἔφατο', '1pl':'ἐφάμεθα', '2pl':'ἔφασθε', '3pl':'ἔφαντο' },
      'fut.act': { '1sg':'φήσω', '2sg':'φήσεις', '3sg':'φήσει', '1pl':'φήσομεν', '2pl':'φήσετε', '3pl':'φήσουσι(ν)' },
      'fut.mid': { '1sg':'φήσομαι', '2sg':['φήσῃ','φήσει'], '3sg':'φήσεται', '1pl':'φησόμεθα', '2pl':'φήσεσθε', '3pl':'φήσονται' },
      'aor.act': { '1sg':'ἔφησα', '2sg':'ἔφησας', '3sg':'ἔφησε(ν)', '1pl':'ἐφήσαμεν', '2pl':'ἐφήσατε', '3pl':'ἔφησαν' },
      'perf.mp': { '1sg':'πέφαμαι', '2sg':'πέφασαι', '3sg':'πέφαται', '1pl':'πεφάμεθα', '2pl':'πέφασθε', '3pl':'πέφανται' },
      'pres.act.subj': { '1sg':'φῶ', '2sg':'φῇς', '3sg':'φῇ', '1pl':'φῶμεν', '2pl':'φῆτε', '3pl':'φῶσι(ν)' },
      'pres.act.opt': { '1sg':['φαίην','φαῖμι'], '2sg':['φαίης','φαῖς'], '3sg':['φαίη','φαῖ'], '1pl':['φαῖμεν','φαίημεν'], '2pl':['φαῖτε','φαίητε'], '3pl':['φαῖεν','φαίησαν'] },
      'pres.act.imper': { '2sg':['φαθί','φάθι'], '3sg':'φάτω', '2pl':'φάτε', '3pl':'φάντων' },
      'pres.mp.subj': { '1sg':'φῶμαι', '2sg':'φῇ', '3sg':'φῆται', '1pl':'φώμεθα', '2pl':'φῆσθε', '3pl':'φῶνται' },
      'pres.mp.opt': { '1sg':'φαίμην', '2sg':'φαῖο', '3sg':'φαῖτο', '1pl':'φαίμεθα', '2pl':'φαῖσθε', '3pl':'φαῖντο' },
      'pres.mp.imper': { '2sg':'φάσο', '3sg':'φάσθω', '2pl':'φάσθε', '3pl':'φάσθων' },
      'fut.act.opt': { '1sg':'φήσοιμι', '2sg':'φήσοις', '3sg':'φήσοι', '1pl':'φήσοιμεν', '2pl':'φήσοιτε', '3pl':'φήσοιεν' },
      'fut.mid.opt': { '1sg':'φησοίμην', '2sg':'φήσοιο', '3sg':'φήσοιτο', '1pl':'φησοίμεθα', '2pl':'φήσοισθε', '3pl':'φήσοιντο' },
      'aor.act.subj': { '1sg':'φήσω', '2sg':'φήσῃς', '3sg':'φήσῃ', '1pl':'φήσωμεν', '2pl':'φήσητε', '3pl':'φήσωσι(ν)' },
      'aor.act.opt': { '1sg':'φήσαιμι', '2sg':['φήσειας','φήσαις'], '3sg':['φήσειε(ν)','φήσαι'], '1pl':'φήσαιμεν', '2pl':'φήσαιτε', '3pl':['φήσειαν','φήσαιεν'] },
      'aor.act.imper': { '2sg':'φῆσον', '3sg':'φησάτω', '2pl':'φήσατε', '3pl':'φησάντων' },
      'pres.act.inf': { inf:'φάναι' },
      'pres.mp.inf': { inf:'φάσθαι' },
      'fut.act.inf': { inf:'φήσειν' },
      'fut.mid.inf': { inf:'φήσεσθαι' },
      'aor.act.inf': { inf:'φῆσαι' },
      'perf.mp.inf': { inf:'πεφάσθαι' },
      /* Back in the deck 2026-08-23, Karsten's call: the -μι verbs' perfect
         moods and future perfect return, while λύω's and the contract verbs'
         stay in data/greek-archive.js. His page prints none of these; the
         athematic paradigms are the ones he wants whole. */
      'perf.mp.subj': { '1sg':'πεφασμένος ὦ', '2sg':'πεφασμένος ᾖς', '3sg':'πεφασμένος ᾖ', '1pl':'πεφασμένοι ὦμεν', '2pl':'πεφασμένοι ἦτε', '3pl':'πεφασμένοι ὦσι(ν)' },
      'perf.mp.opt': { '1sg':'πεφασμένος εἴην', '2sg':'πεφασμένος εἴης', '3sg':'πεφασμένος εἴη', '1pl':['πεφασμένοι εἴημεν','πεφασμένοι εἶμεν'], '2pl':['πεφασμένοι εἴητε','πεφασμένοι εἶτε'], '3pl':['πεφασμένοι εἴησαν','πεφασμένοι εἶεν'] },
      'perf.mp.imper': { '2sg':'πέφασο', '3sg':'πεφάσθω', '2pl':'πέφασθε', '3pl':'πεφάσθων' }
    }
  },

  /* ---- οἶδα, to know: a perfect that means a present ----
     The third verb of this group, and the one HANDOFF never even listed as
     missing. οἶδα has no present and no imperfect at all: its PERFECT is its
     present ("I have seen" -> "I know") and its PLUPERFECT is its imperfect
     ("I knew"). The categories are therefore perf.act and plup.act, which is
     what the form is, rather than pres.act and impf.act, which is what the
     meaning is -- the same choice every grammar makes, and the reason its
     subjunctive is εἰδῶ and not something built on οιδ-.

     Its future εἴσομαι is middle in form. Unlike εἰμί's, it is filed as
     fut.mid and not aliased, because this verb has no other future to
     confuse it with and no reason to pretend otherwise.

     ONE narrowing, and it is a different kind from φημί's: the oracle offers
     οἶδας, οἴδαμεν and οἴδατε beside οἶσθα, ἴσμεν and ἴστε. Those are Koine,
     not Attic. They are ALTERNATIVES INSIDE a cell rather than a tense system
     of their own, so dropping them removes nothing from the deck -- the
     displayed answer was already the Attic one -- and stops a post-classical
     form being marked right while drilling Attic. The plural forms are the
     ones a beginner gets wrong, so it is exactly where leniency would cost
     something.

     Two of its forms are shared outright with other verbs in this deck:
     ἴσθι is both "know!" here and "be!" from εἰμί, and ἴστε is both this
     verb's second plural indicative and its imperative. Reverse lookup
     returns every hit for a form and is right to. ---- */
  athematic_oida: {
    kind: 'verb', label: 'οἶδα (to know)', literal: true,
    subtitle: 'οἶδα, εἴσομαι — to know',
    example: { lemma:'οἶδα', class:'athematic_oida', meaning:'to know' },
    categories: [
      'fut.mid',
      'perf.act',
      'plup.act',
      'fut.mid.opt',
      'perf.act.subj',
      'perf.act.opt',
      'perf.act.imper',
      'fut.mid.inf',
      'perf.act.inf'],
    cellKeys: ['1sg','2sg','3sg','1pl','2pl','3pl'],
    endings: {
      'fut.mid': { '1sg':'εἴσομαι', '2sg':['εἴσῃ','εἴσει'], '3sg':'εἴσεται', '1pl':'εἰσόμεθα', '2pl':'εἴσεσθε', '3pl':'εἴσονται' },
      'perf.act': { '1sg':'οἶδα', '2sg':'οἶσθα', '3sg':'οἶδε(ν)', '1pl':'ἴσμεν', '2pl':'ἴστε', '3pl':'ἴσασι(ν)' },   // Koine οἶδας/οἴδαμεν/οἴδατε dropped: see above
      'plup.act': { '1sg':['ᾔδειν','ᾔδη'], '2sg':['ᾔδεις','ᾔδησθα'], '3sg':'ᾔδει(ν)', '1pl':['ᾖσμεν','ᾔδεμεν'], '2pl':['ᾖστε','ᾔδετε'], '3pl':['ᾖσαν','ᾔδεσαν'] },
      'fut.mid.opt': { '1sg':'εἰσοίμην', '2sg':'εἴσοιο', '3sg':'εἴσοιτο', '1pl':'εἰσοίμεθα', '2pl':'εἴσοισθε', '3pl':'εἴσοιντο' },
      'perf.act.subj': { '1sg':'εἰδῶ', '2sg':'εἰδῇς', '3sg':'εἰδῇ', '1pl':'εἰδῶμεν', '2pl':'εἰδῆτε', '3pl':'εἰδῶσι(ν)' },
      'perf.act.opt': { '1sg':['εἰδείην','εἰδεῖμι'], '2sg':['εἰδείης','εἰδεῖς'], '3sg':['εἰδείη','εἰδεῖ'], '1pl':['εἰδεῖμεν','εἰδείημεν'], '2pl':['εἰδεῖτε','εἰδείητε'], '3pl':['εἰδεῖεν','εἰδείησαν'] },
      'perf.act.imper': { '2sg':'ἴσθι', '3sg':'ἴστω', '2pl':'ἴστε', '3pl':'ἴστων' },
      'fut.mid.inf': { inf:'εἴσεσθαι' },
      'perf.act.inf': { inf:'εἰδέναι' }
    }
  },

  /* =====================================================================
     THE APPENDIX'S OWN TABLES -- the patterns his revision pages print and
     the deck had no card for.

     Generated by tools/appendix/gen_classes.py from "Grammar Tables.pdf"
     (textbook pp.322-338), so the form drilled is the form on the page.
     Everything above this line came from Wiktionary; everything below it
     came from the book, which is the point: until 2026-08-22 nothing in
     this file had ever been checked against the document the whole project
     exists to carry (APPENDIX_COVERAGE.md).

     Two things are NOT taken from the page as printed, and both are
     recorded rather than applied silently -- CORRECTIONS in the generator
     lists twenty cells the appendix prints wrong (χάριστας for χάριτας,
     the accusative and vocative of χείρ swapped, ἱστάντες repeated in the
     accusative, λαβόμενος accented on the wrong syllable in eight cells),
     and every one of them is also in tests/tests.js's
     APPENDIX_DISAGREEMENTS so the coverage report says which side is wrong.

     Where the appendix abbreviates a participle to its nominative and
     genitive and prints "…" for the rest, the class carries those two rows
     and stops. The rest is not derivable: accent is word-specific here (see
     the provenance note at the top of this file), and inventing it is the
     one thing that note forbids.
     ===================================================================== */

  decl1_a_mixed: {
    kind: 'noun', label: '1st Declension (ᾰ-stem with -ᾱς genitive)', literal: true,
    subtitle: 'μοῖρα, μοίρας — fate, portion',
    example: { lemma:'μοῖρα', class:'decl1_a_mixed', meaning:'fate, portion, destiny' },
    categories: ['nom', 'voc', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'sg':'μοῖρα', 'pl':'μοῖραι' },
      voc: { 'sg':'μοῖρα', 'pl':'μοῖραι' },
      acc: { 'sg':'μοῖραν', 'pl':'μοίρας' },
      gen: { 'sg':'μοίρας', 'pl':'μοιρῶν' },
      dat: { 'sg':'μοίρᾳ', 'pl':'μοίραις' }
    }
  },

  decl3_delta: {
    kind: 'noun', label: '3rd Declension (dental -δ stem)', literal: true,
    subtitle: 'ἀσπίς, ἀσπίδος — shield',
    example: { lemma:'ἀσπίς', class:'decl3_delta', meaning:'shield' },
    categories: ['nom', 'voc', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'sg':'ἀσπίς', 'pl':'ἀσπίδες' },
      voc: { 'sg':'ἀσπί', 'pl':'ἀσπίδες' },
      acc: { 'sg':'ἀσπίδα', 'pl':'ἀσπίδας' },
      gen: { 'sg':'ἀσπίδος', 'pl':'ἀσπίδων' },
      dat: { 'sg':'ἀσπίδι', 'pl':'ἀσπίσι(ν)' }
    }
  },

  decl3_tau: {
    kind: 'noun', label: '3rd Declension (dental -τ stem)', literal: true,
    subtitle: 'χάρις, χάριτος — grace, favour',
    example: { lemma:'χάρις', class:'decl3_tau', meaning:'grace, favour, gratitude' },
    categories: ['nom', 'voc', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'sg':'χάρις', 'pl':'χάριτες' },
      voc: { 'sg':'χάρι', 'pl':'χάριτες' },
      acc: { 'sg':'χάριν', 'pl':'χάριτας' },
      gen: { 'sg':'χάριτος', 'pl':'χαρίτων' },
      dat: { 'sg':'χάριτι', 'pl':'χάρισι(ν)' }
    }
  },

  decl3_rho: {
    kind: 'noun', label: '3rd Declension (liquid -ρ stem)', literal: true,
    subtitle: 'χείρ, χειρός — hand',
    example: { lemma:'χείρ', class:'decl3_rho', meaning:'hand' },
    categories: ['nom', 'voc', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'sg':'χείρ', 'pl':'χεῖρες' },
      voc: { 'sg':'χείρ', 'pl':'χεῖρες' },
      acc: { 'sg':'χεῖρα', 'pl':'χεῖρας' },
      gen: { 'sg':'χειρός', 'pl':'χειρῶν' },
      dat: { 'sg':'χειρί', 'pl':'χειρσί(ν)' }
    }
  },

  decl3_on_long: {
    kind: 'noun', label: '3rd Declension (nu-stem, -ων -ῶνος)', literal: true,
    subtitle: 'ἀγών, ἀγῶνος — contest, struggle',
    example: { lemma:'ἀγών', class:'decl3_on_long', meaning:'contest, struggle' },
    categories: ['nom', 'voc', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'sg':'ἀγών', 'pl':'ἀγῶνες' },
      voc: { 'sg':'ἀγών', 'pl':'ἀγῶνες' },
      acc: { 'sg':'ἀγῶνα', 'pl':'ἀγῶνας' },
      gen: { 'sg':'ἀγῶνος', 'pl':'ἀγώνων' },
      dat: { 'sg':'ἀγῶνι', 'pl':'ἀγῶσι(ν)' }
    }
  },

  decl3_on_short: {
    kind: 'noun', label: '3rd Declension (nu-stem, -ων -ονος)', literal: true,
    subtitle: 'δαίμων, δαίμονος — divinity, spirit',
    example: { lemma:'δαίμων', class:'decl3_on_short', meaning:'divinity, spirit' },
    categories: ['nom', 'voc', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'sg':'δαίμων', 'pl':'δαίμονες' },
      voc: { 'sg':'δαῖμον', 'pl':'δαίμονες' },
      acc: { 'sg':'δαίμονα', 'pl':'δαίμονας' },
      gen: { 'sg':'δαίμονος', 'pl':'δαιμόνων' },
      dat: { 'sg':'δαίμονι', 'pl':'δαίμοσι(ν)' }
    }
  },

  decl3_ont: {
    kind: 'noun', label: '3rd Declension (nu-stem, -ων -οντος)', literal: true,
    subtitle: 'ἄρχων, ἄρχοντος — ruler, magistrate',
    example: { lemma:'ἄρχων', class:'decl3_ont', meaning:'ruler, magistrate' },
    categories: ['nom', 'voc', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'sg':'ἄρχων', 'pl':'ἄρχοντες' },
      voc: { 'sg':'ἄρχον', 'pl':'ἄρχοντες' },
      acc: { 'sg':'ἄρχοντα', 'pl':'ἄρχοντας' },
      gen: { 'sg':'ἄρχοντος', 'pl':'ἀρχόντων' },
      dat: { 'sg':'ἄρχοντι', 'pl':'ἄρχουσι(ν)' }
    }
  },

  decl3_hydor: {
    kind: 'noun', label: 'ὕδωρ (irregular neuter)', literal: true,
    subtitle: 'ὕδωρ, ὕδατος — water',
    example: { lemma:'ὕδωρ', class:'decl3_hydor', meaning:'water' },
    categories: ['nom', 'voc', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'sg':'ὕδωρ', 'pl':'ὕδατα' },
      voc: { 'sg':'ὕδωρ', 'pl':'ὕδατα' },
      acc: { 'sg':'ὕδωρ', 'pl':'ὕδατα' },
      gen: { 'sg':'ὕδατος', 'pl':'ὑδάτων' },
      dat: { 'sg':'ὕδατι', 'pl':'ὕδασι(ν)' }
    }
  },

  decl3_phos: {
    kind: 'noun', label: 'φῶς (irregular neuter)', literal: true,
    subtitle: 'φῶς, φωτός — light',
    example: { lemma:'φῶς', class:'decl3_phos', meaning:'light' },
    categories: ['nom', 'voc', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'sg':'φῶς', 'pl':'φῶτα' },
      voc: { 'sg':'φῶς', 'pl':'φῶτα' },
      acc: { 'sg':'φῶς', 'pl':'φῶτα' },
      gen: { 'sg':'φωτός', 'pl':'φώτων' },
      dat: { 'sg':'φωτί', 'pl':'φωσί(ν)' }
    }
  },

  decl3_es_m: {
    kind: 'noun', label: '3rd Declension (sigma stem, masculine)', literal: true,
    subtitle: 'Σωκράτης, Σωκράτους — Socrates',
    example: { lemma:'Σωκράτης', class:'decl3_es_m', meaning:'Socrates' },
    categories: ['nom', 'voc', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'sg':'Σωκράτης' },
      voc: { 'sg':'Σώκρατες' },
      acc: { 'sg':'Σωκράτη' },
      gen: { 'sg':'Σωκράτους' },
      dat: { 'sg':'Σωκράτει' }
    }
  },

  decl3_syncop_strong: {
    kind: 'noun', label: '3rd Declension (syncopated liquid, strong)', literal: true,
    subtitle: 'μήτηρ, μητρός — mother',
    example: { lemma:'μήτηρ', class:'decl3_syncop_strong', meaning:'mother' },
    categories: ['nom', 'voc', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'sg':'μήτηρ', 'pl':'μητέρες' },
      voc: { 'sg':'μῆτερ', 'pl':'μητέρες' },
      acc: { 'sg':'μητέρα', 'pl':'μητέρας' },
      gen: { 'sg':'μητρός', 'pl':'μητέρων' },
      dat: { 'sg':'μητρί', 'pl':'μητράσι(ν)' }
    }
  },

  decl3_syncop_weak: {
    kind: 'noun', label: '3rd Declension (syncopated liquid, weak)', literal: true,
    subtitle: 'ἀνήρ, ἀνδρός — man, husband',
    example: { lemma:'ἀνήρ', class:'decl3_syncop_weak', meaning:'man, husband' },
    categories: ['nom', 'voc', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'sg':'ἀνήρ', 'pl':'ἄνδρες' },
      voc: { 'sg':'ἄνερ', 'pl':'ἄνδρες' },
      acc: { 'sg':'ἄνδρα', 'pl':'ἄνδρας' },
      gen: { 'sg':'ἀνδρός', 'pl':'ἀνδρῶν' },
      dat: { 'sg':'ἀνδρί', 'pl':'ἀνδράσι(ν)' }
    }
  },

  decl3_ys: {
    kind: 'noun', label: '3rd Declension (υ-stem)', literal: true,
    subtitle: 'πρέσβυς, πρέσβεως — old man, ambassador',
    example: { lemma:'πρέσβυς', class:'decl3_ys', meaning:'old man; (pl.) ambassadors' },
    categories: ['nom', 'voc', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'sg':'πρέσβυς', 'pl':'πρέσβεις' },
      voc: { 'sg':'πρέσβυ', 'pl':'πρέσβεις' },
      acc: { 'sg':'πρέσβυν', 'pl':'πρέσβεις' },
      gen: { 'sg':'πρέσβεως', 'pl':'πρέσβεων' },
      dat: { 'sg':'πρέσβει', 'pl':'πρέσβεσι(ν)' }
    }
  },

  pron_emautou: {
    kind: 'adj', label: 'ἐμαυτοῦ (1st person reflexive)', literal: true,
    subtitle: 'ἐμαυτοῦ, ἐμαυτῆς — of myself',
    example: { lemma:'ἐμαυτοῦ, -ῆς', class:'pron_emautou', meaning:'of myself' },
    genders: ['m', 'f'],
    categories: ['acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      acc: { 'm.sg':'ἐμαυτόν', 'm.pl':'ἡμᾶς αὐτούς', 'f.sg':'ἐμαυτήν', 'f.pl':'ἡμᾶς αὐτάς' },
      gen: { 'm.sg':'ἐμαυτοῦ', 'm.pl':'ἡμῶν αὐτῶν', 'f.sg':'ἐμαυτῆς', 'f.pl':'ἡμῶν αὐτῶν' },
      dat: { 'm.sg':'ἐμαυτῷ', 'm.pl':'ἡμῖν αὐτοῖς', 'f.sg':'ἐμαυτῇ', 'f.pl':'ἡμῖν αὐταῖς' }
    }
  },

  pron_seautou: {
    kind: 'adj', label: 'σεαυτοῦ (2nd person reflexive)', literal: true,
    subtitle: 'σεαυτοῦ, σεαυτῆς — of yourself',
    example: { lemma:'σεαυτοῦ, -ῆς', class:'pron_seautou', meaning:'of yourself' },
    genders: ['m', 'f'],
    categories: ['acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      acc: { 'm.sg':'σεαυτόν', 'm.pl':'ὑμᾶς αὐτούς', 'f.sg':'σεαυτήν', 'f.pl':'ὑμᾶς αὐτάς' },
      gen: { 'm.sg':'σεαυτοῦ', 'm.pl':'ὑμῶν αὐτῶν', 'f.sg':'σεαυτῆς', 'f.pl':'ὑμῶν αὐτῶν' },
      dat: { 'm.sg':'σεαυτῷ', 'm.pl':'ὑμῖν αὐτοῖς', 'f.sg':'σεαυτῇ', 'f.pl':'ὑμῖν αὐταῖς' }
    }
  },

  pron_heautou: {
    kind: 'adj', label: 'ἑαυτοῦ (3rd person reflexive)', literal: true,
    subtitle: 'ἑαυτοῦ, ἑαυτῆς, ἑαυτοῦ — of himself, herself, itself',
    example: { lemma:'ἑαυτοῦ, -ῆς, -οῦ', class:'pron_heautou', meaning:'of himself, herself, itself' },
    genders: ['m', 'f', 'n'],
    categories: ['acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      acc: { 'm.sg':['ἑαυτόν','αὑτόν'], 'm.pl':['ἑαυτούς','αὑτούς'], 'f.sg':['ἑαυτήν','αὑτήν'], 'f.pl':['ἑαυτάς','αὑτάς'], 'n.sg':['ἑαυτό','αὑτό'], 'n.pl':['ἑαυτά','αὑτά'] },
      gen: { 'm.sg':['ἑαυτοῦ','αὑτοῦ'], 'm.pl':['ἑαυτῶν','αὑτῶν'], 'f.sg':['ἑαυτῆς','αὑτῆς'], 'f.pl':['ἑαυτῶν','αὑτῶν'], 'n.sg':['ἑαυτοῦ','αὑτοῦ'], 'n.pl':['ἑαυτῶν','αὑτῶν'] },
      dat: { 'm.sg':['ἑαυτῷ','αὑτῷ'], 'm.pl':['ἑαυτοῖς','αὑτοῖς'], 'f.sg':['ἑαυτῇ','αὑτῇ'], 'f.pl':['ἑαυταῖς','αὑταῖς'], 'n.sg':['ἑαυτῷ','αὑτῷ'], 'n.pl':['ἑαυτοῖς','αὑτοῖς'] }
    }
  },

  pron_hode: {
    kind: 'adj', label: 'ὅδε (this here)', literal: true,
    subtitle: 'ὅδε, ἥδε, τόδε — this (near me)',
    example: { lemma:'ὅδε, ἥδε, τόδε', class:'pron_hode', meaning:'this (here)' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'm.sg':'ὅδε', 'm.pl':'οἵδε', 'f.sg':'ἥδε', 'f.pl':'αἵδε', 'n.sg':'τόδε', 'n.pl':'τάδε' },
      acc: { 'm.sg':'τόνδε', 'm.pl':'τούσδε', 'f.sg':'τήνδε', 'f.pl':'τάσδε', 'n.sg':'τόδε', 'n.pl':'τάδε' },
      gen: { 'm.sg':'τοῦδε', 'm.pl':'τῶνδε', 'f.sg':'τῆσδε', 'f.pl':'τῶνδε', 'n.sg':'τοῦδε', 'n.pl':'τῶνδε' },
      dat: { 'm.sg':'τῷδε', 'm.pl':'τοῖσδε', 'f.sg':'τῇδε', 'f.pl':'ταῖσδε', 'n.sg':'τῷδε', 'n.pl':'τοῖσδε' }
    }
  },

  pron_tis_indef: {
    kind: 'adj', label: 'τις (someone, something)', literal: true,
    subtitle: 'τις, τι — the indefinite, enclitic',
    example: { lemma:'τις, τι', class:'pron_tis_indef', meaning:'someone, something; a certain' },
    genders: ['mf', 'n'],
    categories: ['nom', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'mf.sg':'τις', 'mf.pl':'τινές', 'n.sg':'τι', 'n.pl':'τινά' },
      acc: { 'mf.sg':'τινά', 'mf.pl':'τινάς', 'n.sg':'τι', 'n.pl':'τινά' },
      gen: { 'mf.sg':['τινός','του'], 'mf.pl':'τινῶν', 'n.sg':['τινός','του'], 'n.pl':'τινῶν' },
      dat: { 'mf.sg':['τινί','τῳ'], 'mf.pl':'τισί(ν)', 'n.sg':['τινί','τῳ'], 'n.pl':'τισί(ν)' }
    }
  },

  adj_os_on: {
    kind: 'adj', label: 'Adjectives in -ος, -ον (two terminations)', literal: true,
    subtitle: 'ἄδικος, ἄδικον — unjust',
    example: { lemma:'ἄδικος, -ον', class:'adj_os_on', meaning:'unjust' },
    genders: ['mf', 'n'],
    categories: ['nom', 'voc', 'acc', 'gen', 'dat', 'comp', 'sup'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'mf.sg':'ἄδικος', 'mf.pl':'ἄδικοι', 'n.sg':'ἄδικον', 'n.pl':'ἄδικα' },
      voc: { 'mf.sg':'ἄδικε', 'mf.pl':'ἄδικοι', 'n.sg':'ἄδικον', 'n.pl':'ἄδικα' },
      acc: { 'mf.sg':'ἄδικον', 'mf.pl':'ἀδίκους', 'n.sg':'ἄδικον', 'n.pl':'ἄδικα' },
      gen: { 'mf.sg':'ἀδίκου', 'mf.pl':'ἀδίκων', 'n.sg':'ἀδίκου', 'n.pl':'ἀδίκων' },
      dat: { 'mf.sg':'ἀδίκῳ', 'mf.pl':'ἀδίκοις', 'n.sg':'ἀδίκῳ', 'n.pl':'ἀδίκοις' },
      // Comparative and superlative. Every adjective table in the appendix
      // carries these two rows and the deck had not one of them, which made
      // comparison the single most examinable thing missing (pp.327-329).
      // Only the nominative singular is printed, so only that is drilled:
      // the comparative declines like a 2-1-2 adjective, but deriving its
      // other cells means deriving accents, which this file does not do.
      // Two-termination adjectives are printed masculine and feminine
      // together (ἀληθέστερος, ἀληθεστέρα); both are accepted.
      comp: { 'mf.sg':['ἀδικότερος','ἀδικοτέρα'], 'n.sg':'ἀδικότερον' },
      sup:  { 'mf.sg':['ἀδικότατος','ἀδικοτάτη'], 'n.sg':'ἀδικότατον' }
    }
  },

  part_ago_aor2_act: {
    kind: 'adj', label: 'ἀγαγών', literal: true,
    subtitle: 'ἀγαγών — 2nd aorist active participle of ἄγω',
    example: { lemma:'ἀγαγών', class:'part_ago_aor2_act', meaning:'2nd aorist active participle of ἄγω' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'm.sg':'ἀγαγών', 'm.pl':'ἀγαγόντες', 'f.sg':'ἀγαγοῦσα', 'f.pl':'ἀγαγοῦσαι', 'n.sg':'ἀγαγόν', 'n.pl':'ἀγαγόντα' },
      acc: { 'm.sg':'ἀγαγόντα', 'm.pl':'ἀγαγόντας', 'f.sg':'ἀγαγοῦσαν', 'f.pl':'ἀγαγούσας', 'n.sg':'ἀγαγόν', 'n.pl':'ἀγαγόντα' },
      gen: { 'm.sg':'ἀγαγόντος', 'm.pl':'ἀγαγόντων', 'f.sg':'ἀγαγούσης', 'f.pl':'ἀγαγουσῶν', 'n.sg':'ἀγαγόντος', 'n.pl':'ἀγαγόντων' },
      dat: { 'm.sg':'ἀγαγόντι', 'm.pl':'ἀγαγοῦσι(ν)', 'f.sg':'ἀγαγούσῃ', 'f.pl':'ἀγαγούσαις', 'n.sg':'ἀγαγόντι', 'n.pl':'ἀγαγοῦσι(ν)' }
    }
  },

  part_lyo_aor_mid: {
    kind: 'adj', label: 'λυσάμενος', literal: true,
    subtitle: 'λυσάμενος — aorist middle participle of λύω',
    example: { lemma:'λυσάμενος', class:'part_lyo_aor_mid', meaning:'aorist middle participle of λύω' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'm.sg':'λυσάμενος', 'm.pl':'λυσάμενοι', 'f.sg':'λυσαμένη', 'f.pl':'λυσάμεναι', 'n.sg':'λυσάμενον', 'n.pl':'λυσάμενα' },
      acc: { 'm.sg':'λυσάμενον', 'm.pl':'λυσαμένους', 'f.sg':'λυσαμένην', 'f.pl':'λυσαμένας', 'n.sg':'λυσάμενον', 'n.pl':'λυσάμενα' },
      gen: { 'm.sg':'λυσαμένου', 'm.pl':'λυσαμένων', 'f.sg':'λυσαμένης', 'f.pl':'λυσαμένων', 'n.sg':'λυσαμένου', 'n.pl':'λυσαμένων' },
      dat: { 'm.sg':'λυσαμένῳ', 'm.pl':'λυσαμένοις', 'f.sg':'λυσαμένῃ', 'f.pl':'λυσαμέναις', 'n.sg':'λυσαμένῳ', 'n.pl':'λυσαμένοις' }
    }
  },

  part_lambano_aor2_mid: {
    kind: 'adj', label: 'λαβόμενος', literal: true,
    subtitle: 'λαβόμενος — 2nd aorist middle participle of λαμβάνω',
    example: { lemma:'λαβόμενος', class:'part_lambano_aor2_mid', meaning:'2nd aorist middle participle of λαμβάνω' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'm.sg':'λαβόμενος', 'm.pl':'λαβόμενοι', 'f.sg':'λαβομένη', 'f.pl':'λαβόμεναι', 'n.sg':'λαβόμενον', 'n.pl':'λαβόμενα' },
      acc: { 'm.sg':'λαβόμενον', 'm.pl':'λαβομένους', 'f.sg':'λαβομένην', 'f.pl':'λαβομένας', 'n.sg':'λαβόμενον', 'n.pl':'λαβόμενα' },
      gen: { 'm.sg':'λαβομένου', 'm.pl':'λαβομένων', 'f.sg':'λαβομένης', 'f.pl':'λαβομένων', 'n.sg':'λαβομένου', 'n.pl':'λαβομένων' },
      dat: { 'm.sg':'λαβομένῳ', 'm.pl':'λαβομένοις', 'f.sg':'λαβομένῃ', 'f.pl':'λαβομέναις', 'n.sg':'λαβομένῳ', 'n.pl':'λαβομένοις' }
    }
  },

  part_erotao_pres_act: {
    kind: 'adj', label: 'ἐρωτῶν', literal: true,
    subtitle: 'ἐρωτῶν — present active participle of ἐρωτάω',
    example: { lemma:'ἐρωτῶν', class:'part_erotao_pres_act', meaning:'present active participle of ἐρωτάω' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'gen'],
    cellKeys: ['sg', 'pl'],
    // The appendix abbreviates this table to its nominative and genitive
    // and prints an ellipsis for the rest. Those two rows are what it gives,
    // and they are what is drilled: the remaining accents are not derivable.
    endings: {
      nom: { 'm.sg':'ἐρωτῶν', 'm.pl':'ἐρωτῶντες', 'f.sg':'ἐρωτῶσα', 'f.pl':'ἐρωτῶσαι', 'n.sg':'ἐρωτῶν', 'n.pl':'ἐρωτῶντα' },
      gen: { 'm.sg':'ἐρωτῶντος', 'm.pl':'ἐρωτώντων', 'f.sg':'ἐρωτώσης', 'f.pl':'ἐρωτωσῶν', 'n.sg':'ἐρωτῶντος', 'n.pl':'ἐρωτώντων' }
    }
  },

  part_erotao_pres_mp: {
    kind: 'adj', label: 'ἐρωτώμενος', literal: true,
    subtitle: 'ἐρωτώμενος — present middle/passive participle of ἐρωτάω',
    example: { lemma:'ἐρωτώμενος', class:'part_erotao_pres_mp', meaning:'present middle/passive participle of ἐρωτάω' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'gen'],
    cellKeys: ['sg', 'pl'],
    // The appendix abbreviates this table to its nominative and genitive
    // and prints an ellipsis for the rest. Those two rows are what it gives,
    // and they are what is drilled: the remaining accents are not derivable.
    endings: {
      nom: { 'm.sg':'ἐρωτώμενος', 'm.pl':'ἐρωτώμενοι', 'f.sg':'ἐρωτωμένη', 'f.pl':'ἐρωτώμεναι', 'n.sg':'ἐρωτώμενον', 'n.pl':'ἐρωτώμενα' },
      gen: { 'm.sg':'ἐρωτωμένου', 'm.pl':'ἐρωτωμένων', 'f.sg':'ἐρωτωμένης', 'f.pl':'ἐρωτωμένων', 'n.sg':'ἐρωτωμένου', 'n.pl':'ἐρωτωμένων' }
    }
  },

  part_poieo_pres_act: {
    kind: 'adj', label: 'ποιῶν', literal: true,
    subtitle: 'ποιῶν — present active participle of ποιέω',
    example: { lemma:'ποιῶν', class:'part_poieo_pres_act', meaning:'present active participle of ποιέω' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'gen'],
    cellKeys: ['sg', 'pl'],
    // The appendix abbreviates this table to its nominative and genitive
    // and prints an ellipsis for the rest. Those two rows are what it gives,
    // and they are what is drilled: the remaining accents are not derivable.
    endings: {
      nom: { 'm.sg':'ποιῶν', 'm.pl':'ποιοῦντες', 'f.sg':'ποιοῦσα', 'f.pl':'ποιοῦσαι', 'n.sg':'ποιοῦν', 'n.pl':'ποιοῦντα' },
      gen: { 'm.sg':'ποιοῦντος', 'm.pl':'ποιούντων', 'f.sg':'ποιούσης', 'f.pl':'ποιουσῶν', 'n.sg':'ποιοῦντος', 'n.pl':'ποιούντων' }
    }
  },

  part_poieo_pres_mp: {
    kind: 'adj', label: 'ποιούμενος', literal: true,
    subtitle: 'ποιούμενος — present middle/passive participle of ποιέω',
    example: { lemma:'ποιούμενος', class:'part_poieo_pres_mp', meaning:'present middle/passive participle of ποιέω' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'gen'],
    cellKeys: ['sg', 'pl'],
    // The appendix abbreviates this table to its nominative and genitive
    // and prints an ellipsis for the rest. Those two rows are what it gives,
    // and they are what is drilled: the remaining accents are not derivable.
    endings: {
      nom: { 'm.sg':'ποιούμενος', 'm.pl':'ποιούμενοι', 'f.sg':'ποιουμένη', 'f.pl':'ποιούμεναι', 'n.sg':'ποιούμενον', 'n.pl':'ποιούμενα' },
      gen: { 'm.sg':'ποιουμένου', 'm.pl':'ποιουμένων', 'f.sg':'ποιουμένης', 'f.pl':'ποιουμένων', 'n.sg':'ποιουμένου', 'n.pl':'ποιουμένων' }
    }
  },

  part_deloo_pres_act: {
    kind: 'adj', label: 'δηλῶν', literal: true,
    subtitle: 'δηλῶν — present active participle of δηλόω',
    example: { lemma:'δηλῶν', class:'part_deloo_pres_act', meaning:'present active participle of δηλόω' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'gen'],
    cellKeys: ['sg', 'pl'],
    // The appendix abbreviates this table to its nominative and genitive
    // and prints an ellipsis for the rest. Those two rows are what it gives,
    // and they are what is drilled: the remaining accents are not derivable.
    endings: {
      nom: { 'm.sg':'δηλῶν', 'm.pl':'δηλοῦντες', 'f.sg':'δηλοῦσα', 'f.pl':'δηλοῦσαι', 'n.sg':'δηλοῦν', 'n.pl':'δηλοῦντα' },
      gen: { 'm.sg':'δηλοῦντος', 'm.pl':'δηλούντων', 'f.sg':'δηλούσης', 'f.pl':'δηλουσῶν', 'n.sg':'δηλοῦντος', 'n.pl':'δηλούντων' }
    }
  },

  part_deloo_pres_mp: {
    kind: 'adj', label: 'δηλούμενος', literal: true,
    subtitle: 'δηλούμενος — present middle/passive participle of δηλόω',
    example: { lemma:'δηλούμενος', class:'part_deloo_pres_mp', meaning:'present middle/passive participle of δηλόω' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'gen'],
    cellKeys: ['sg', 'pl'],
    // The appendix abbreviates this table to its nominative and genitive
    // and prints an ellipsis for the rest. Those two rows are what it gives,
    // and they are what is drilled: the remaining accents are not derivable.
    endings: {
      nom: { 'm.sg':'δηλούμενος', 'm.pl':'δηλούμενοι', 'f.sg':'δηλουμένη', 'f.pl':'δηλούμεναι', 'n.sg':'δηλούμενον', 'n.pl':'δηλούμενα' },
      gen: { 'm.sg':'δηλουμένου', 'm.pl':'δηλουμένων', 'f.sg':'δηλουμένης', 'f.pl':'δηλουμένων', 'n.sg':'δηλουμένου', 'n.pl':'δηλουμένων' }
    }
  },

  part_apollymi_pres_act: {
    kind: 'adj', label: 'ἀπολλύς', literal: true,
    subtitle: 'ἀπολλύς — present active participle of ἀπόλλυμι',
    example: { lemma:'ἀπολλύς', class:'part_apollymi_pres_act', meaning:'present active participle of ἀπόλλυμι' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'm.sg':'ἀπολλύς', 'm.pl':'ἀπολλύντες', 'f.sg':'ἀπολλῦσα', 'f.pl':'ἀπολλῦσαι', 'n.sg':'ἀπολλύν', 'n.pl':'ἀπολλύντα' },
      acc: { 'm.sg':'ἀπολλύντα', 'm.pl':'ἀπολλύντας', 'f.sg':'ἀπολλῦσαν', 'f.pl':'ἀπολλύσας', 'n.sg':'ἀπολλύν', 'n.pl':'ἀπολλύντα' },
      gen: { 'm.sg':'ἀπολλύντος', 'm.pl':'ἀπολλύντων', 'f.sg':'ἀπολλύσης', 'f.pl':'ἀπολλυσῶν', 'n.sg':'ἀπολλύντος', 'n.pl':'ἀπολλύντων' },
      dat: { 'm.sg':'ἀπολλύντι', 'm.pl':'ἀπολλῦσι(ν)', 'f.sg':'ἀπολλύσῃ', 'f.pl':'ἀπολλύσαις', 'n.sg':'ἀπολλύντι', 'n.pl':'ἀπολλῦσι(ν)' }
    }
  },

  part_deiknymi_pres_act: {
    kind: 'adj', label: 'δεικνύς', literal: true,
    subtitle: 'δεικνύς — present active participle of δείκνυμι',
    example: { lemma:'δεικνύς', class:'part_deiknymi_pres_act', meaning:'present active participle of δείκνυμι' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'm.sg':'δεικνύς', 'm.pl':'δεικνύντες', 'f.sg':'δεικνῦσα', 'f.pl':'δεικνῦσαι', 'n.sg':'δεικνύν', 'n.pl':'δεικνύντα' },
      acc: { 'm.sg':'δεικνύντα', 'm.pl':'δεικνύντας', 'f.sg':'δεικνῦσαν', 'f.pl':'δεικνύσας', 'n.sg':'δεικνύν', 'n.pl':'δεικνύντα' },
      gen: { 'm.sg':'δεικνύντος', 'm.pl':'δεικνύντων', 'f.sg':'δεικνύσης', 'f.pl':'δεικνυσῶν', 'n.sg':'δεικνύντος', 'n.pl':'δεικνύντων' },
      dat: { 'm.sg':'δεικνύντι', 'm.pl':'δεικνῦσι(ν)', 'f.sg':'δεικνύσῃ', 'f.pl':'δεικνύσαις', 'n.sg':'δεικνύντι', 'n.pl':'δεικνῦσι(ν)' }
    }
  },

  part_mignymi_pres_act: {
    kind: 'adj', label: 'μιγνύς', literal: true,
    subtitle: 'μιγνύς — present active participle of μίγνυμι',
    example: { lemma:'μιγνύς', class:'part_mignymi_pres_act', meaning:'present active participle of μίγνυμι' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'm.sg':'μιγνύς', 'm.pl':'μιγνύντες', 'f.sg':'μιγνῦσα', 'f.pl':'μιγνῦσαι', 'n.sg':'μιγνύν', 'n.pl':'μιγνύντα' },
      acc: { 'm.sg':'μιγνύντα', 'm.pl':'μιγνύντας', 'f.sg':'μιγνῦσαν', 'f.pl':'μιγνύσας', 'n.sg':'μιγνύν', 'n.pl':'μιγνύντα' },
      gen: { 'm.sg':'μιγνύντος', 'm.pl':'μιγνύντων', 'f.sg':'μιγνύσης', 'f.pl':'μιγνυσῶν', 'n.sg':'μιγνύντος', 'n.pl':'μιγνύντων' },
      dat: { 'm.sg':'μιγνύντι', 'm.pl':'μιγνῦσι(ν)', 'f.sg':'μιγνύσῃ', 'f.pl':'μιγνύσαις', 'n.sg':'μιγνύντι', 'n.pl':'μιγνῦσι(ν)' }
    }
  },

  part_didomi_pres_act: {
    kind: 'adj', label: 'διδούς', literal: true,
    subtitle: 'διδούς — present active participle of δίδωμι',
    example: { lemma:'διδούς', class:'part_didomi_pres_act', meaning:'present active participle of δίδωμι' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'm.sg':'διδούς', 'm.pl':'διδόντες', 'f.sg':'διδοῦσα', 'f.pl':'διδοῦσαι', 'n.sg':'διδόν', 'n.pl':'διδόντα' },
      acc: { 'm.sg':'διδόντα', 'm.pl':'διδόντας', 'f.sg':'διδοῦσαν', 'f.pl':'διδούσας', 'n.sg':'διδόν', 'n.pl':'διδόντα' },
      gen: { 'm.sg':'διδόντος', 'm.pl':'διδόντων', 'f.sg':'διδούσης', 'f.pl':'διδουσῶν', 'n.sg':'διδόντος', 'n.pl':'διδόντων' },
      dat: { 'm.sg':'διδόντι', 'm.pl':'διδοῦσι(ν)', 'f.sg':'διδούσῃ', 'f.pl':'διδούσαις', 'n.sg':'διδόντι', 'n.pl':'διδοῦσι(ν)' }
    }
  },

  part_didomi_aor_act: {
    kind: 'adj', label: 'δούς', literal: true,
    subtitle: 'δούς — aorist active participle of δίδωμι',
    example: { lemma:'δούς', class:'part_didomi_aor_act', meaning:'aorist active participle of δίδωμι' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'gen'],
    cellKeys: ['sg', 'pl'],
    // The appendix abbreviates this table to its nominative and genitive
    // and prints an ellipsis for the rest. Those two rows are what it gives,
    // and they are what is drilled: the remaining accents are not derivable.
    endings: {
      nom: { 'm.sg':'δούς', 'm.pl':'δόντες', 'f.sg':'δοῦσα', 'f.pl':'δοῦσαι', 'n.sg':'δόν', 'n.pl':'δόντα' },
      gen: { 'm.sg':'δόντος', 'm.pl':'δόντων', 'f.sg':'δούσης', 'f.pl':'δουσῶν', 'n.sg':'δόντος', 'n.pl':'δόντων' }
    }
  },

  part_tithemi_pres_act: {
    kind: 'adj', label: 'τιθείς', literal: true,
    subtitle: 'τιθείς — present active participle of τίθημι',
    example: { lemma:'τιθείς', class:'part_tithemi_pres_act', meaning:'present active participle of τίθημι' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'm.sg':'τιθείς', 'm.pl':'τιθέντες', 'f.sg':'τιθεῖσα', 'f.pl':'τιθεῖσαι', 'n.sg':'τιθέν', 'n.pl':'τιθέντα' },
      acc: { 'm.sg':'τιθέντα', 'm.pl':'τιθέντας', 'f.sg':'τιθεῖσαν', 'f.pl':'τιθείσας', 'n.sg':'τιθέν', 'n.pl':'τιθέντα' },
      gen: { 'm.sg':'τιθέντος', 'm.pl':'τιθέντων', 'f.sg':'τιθείσης', 'f.pl':'τιθεισῶν', 'n.sg':'τιθέντος', 'n.pl':'τιθέντων' },
      dat: { 'm.sg':'τιθέντι', 'm.pl':'τιθεῖσι(ν)', 'f.sg':'τιθείσῃ', 'f.pl':'τιθείσαις', 'n.sg':'τιθέντι', 'n.pl':'τιθεῖσι(ν)' }
    }
  },

  part_tithemi_aor_act: {
    kind: 'adj', label: 'θείς', literal: true,
    subtitle: 'θείς — aorist active participle of τίθημι',
    example: { lemma:'θείς', class:'part_tithemi_aor_act', meaning:'aorist active participle of τίθημι' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'gen'],
    cellKeys: ['sg', 'pl'],
    // The appendix abbreviates this table to its nominative and genitive
    // and prints an ellipsis for the rest. Those two rows are what it gives,
    // and they are what is drilled: the remaining accents are not derivable.
    endings: {
      nom: { 'm.sg':'θείς', 'm.pl':'θέντες', 'f.sg':'θεῖσα', 'f.pl':'θεῖσαι', 'n.sg':'θέν', 'n.pl':'θέντα' },
      gen: { 'm.sg':'θέντος', 'm.pl':'θέντων', 'f.sg':'θείσης', 'f.pl':'θεισῶν', 'n.sg':'θέντος', 'n.pl':'θέντων' }
    }
  },

  part_phemi_pres_act: {
    kind: 'adj', label: 'φάς', literal: true,
    subtitle: 'φάς — present active participle of φημί',
    example: { lemma:'φάς', class:'part_phemi_pres_act', meaning:'present active participle of φημί' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'm.sg':'φάς', 'm.pl':'φάντες', 'f.sg':'φᾶσα', 'f.pl':'φᾶσαι', 'n.sg':'φάν', 'n.pl':'φάντα' },
      acc: { 'm.sg':'φάντα', 'm.pl':'φάντας', 'f.sg':'φᾶσαν', 'f.pl':'φάσας', 'n.sg':'φάν', 'n.pl':'φάντα' },
      gen: { 'm.sg':'φάντος', 'm.pl':'φάντων', 'f.sg':'φάσης', 'f.pl':'φασῶν', 'n.sg':'φάντος', 'n.pl':'φάντων' },
      dat: { 'm.sg':'φάντι', 'm.pl':'φᾶσι(ν)', 'f.sg':'φάσῃ', 'f.pl':'φάσαις', 'n.sg':'φάντι', 'n.pl':'φᾶσι(ν)' }
    }
  },

  part_hiemi_pres_act: {
    kind: 'adj', label: 'ἱείς', literal: true,
    subtitle: 'ἱείς — present active participle of ἵημι',
    example: { lemma:'ἱείς', class:'part_hiemi_pres_act', meaning:'present active participle of ἵημι' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'm.sg':'ἱείς', 'm.pl':'ἱέντες', 'f.sg':'ἱεῖσα', 'f.pl':'ἱεῖσαι', 'n.sg':'ἱέν', 'n.pl':'ἱέντα' },
      acc: { 'm.sg':'ἱέντα', 'm.pl':'ἱέντας', 'f.sg':'ἱεῖσαν', 'f.pl':'ἱείσας', 'n.sg':'ἱέν', 'n.pl':'ἱέντα' },
      gen: { 'm.sg':'ἱέντος', 'm.pl':'ἱέντων', 'f.sg':'ἱείσης', 'f.pl':'ἱεισῶν', 'n.sg':'ἱέντος', 'n.pl':'ἱέντων' },
      dat: { 'm.sg':'ἱέντι', 'm.pl':'ἱεῖσι(ν)', 'f.sg':'ἱείσῃ', 'f.pl':'ἱείσαις', 'n.sg':'ἱέντι', 'n.pl':'ἱεῖσι(ν)' }
    }
  },

  part_hiemi_aor_act: {
    kind: 'adj', label: 'εἵς', literal: true,
    subtitle: 'εἵς — aorist active participle of ἵημι',
    example: { lemma:'εἵς', class:'part_hiemi_aor_act', meaning:'aorist active participle of ἵημι' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'gen'],
    cellKeys: ['sg', 'pl'],
    // The appendix abbreviates this table to its nominative and genitive
    // and prints an ellipsis for the rest. Those two rows are what it gives,
    // and they are what is drilled: the remaining accents are not derivable.
    endings: {
      nom: { 'm.sg':'εἵς', 'm.pl':'ἕντες', 'f.sg':'εἷσα', 'f.pl':'εἷσαι', 'n.sg':'ἕν', 'n.pl':'ἕντα' },
      gen: { 'm.sg':'ἕντος', 'm.pl':'ἕντων', 'f.sg':'εἵσης', 'f.pl':'εἱσῶν', 'n.sg':'ἕντος', 'n.pl':'ἕντων' }
    }
  },

  part_histemi_pres_act: {
    kind: 'adj', label: 'ἱστάς', literal: true,
    subtitle: 'ἱστάς — present active participle of ἵστημι',
    example: { lemma:'ἱστάς', class:'part_histemi_pres_act', meaning:'present active participle of ἵστημι' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'm.sg':'ἱστάς', 'm.pl':'ἱστάντες', 'f.sg':'ἱστᾶσα', 'f.pl':'ἱστᾶσαι', 'n.sg':'ἱστάν', 'n.pl':'ἱστάντα' },
      acc: { 'm.sg':'ἱστάντα', 'm.pl':'ἱστάντας', 'f.sg':'ἱστᾶσαν', 'f.pl':'ἱστάσας', 'n.sg':'ἱστάν', 'n.pl':'ἱστάντα' },
      gen: { 'm.sg':'ἱστάντος', 'm.pl':'ἱστάντων', 'f.sg':'ἱστάσης', 'f.pl':'ἱστασῶν', 'n.sg':'ἱστάντος', 'n.pl':'ἱστάντων' },
      dat: { 'm.sg':'ἱστάντι', 'm.pl':'ἱστᾶσι(ν)', 'f.sg':'ἱστάσῃ', 'f.pl':'ἱστάσαις', 'n.sg':'ἱστάντι', 'n.pl':'ἱστᾶσι(ν)' }
    }
  },

  part_histemi_aor2_act: {
    kind: 'adj', label: 'στάς', literal: true,
    subtitle: 'στάς — 2nd aorist active participle of ἵστημι',
    example: { lemma:'στάς', class:'part_histemi_aor2_act', meaning:'2nd aorist active participle of ἵστημι' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'gen'],
    cellKeys: ['sg', 'pl'],
    // The appendix abbreviates this table to its nominative and genitive
    // and prints an ellipsis for the rest. Those two rows are what it gives,
    // and they are what is drilled: the remaining accents are not derivable.
    endings: {
      nom: { 'm.sg':'στάς', 'm.pl':'στάντες', 'f.sg':'στᾶσα', 'f.pl':'στᾶσαι', 'n.sg':'στάν', 'n.pl':'στάντα' },
      gen: { 'm.sg':'στάντος', 'm.pl':'στάντων', 'f.sg':'στάσης', 'f.pl':'στασῶν', 'n.sg':'στάντος', 'n.pl':'στάντων' }
    }
  },

  part_eimi_pres_act: {
    kind: 'adj', label: 'ὤν', literal: true,
    subtitle: 'ὤν — present participle of εἰμί, being',
    example: { lemma:'ὤν', class:'part_eimi_pres_act', meaning:'present participle of εἰμί, being' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'm.sg':'ὤν', 'm.pl':'ὄντες', 'f.sg':'οὖσα', 'f.pl':'οὖσαι', 'n.sg':'ὄν', 'n.pl':'ὄντα' },
      acc: { 'm.sg':'ὄντα', 'm.pl':'ὄντας', 'f.sg':'οὖσαν', 'f.pl':'οὔσας', 'n.sg':'ὄν', 'n.pl':'ὄντα' },
      gen: { 'm.sg':'ὄντος', 'm.pl':'ὄντων', 'f.sg':'οὔσης', 'f.pl':'οὐσῶν', 'n.sg':'ὄντος', 'n.pl':'ὄντων' },
      dat: { 'm.sg':'ὄντι', 'm.pl':'οὖσι(ν)', 'f.sg':'οὔσῃ', 'f.pl':'οὔσαις', 'n.sg':'ὄντι', 'n.pl':'οὖσι(ν)' }
    }
  },

  part_eimi_fut_mid: {
    kind: 'adj', label: 'ἐσόμενος', literal: true,
    subtitle: 'ἐσόμενος — future participle of εἰμί — about to be',
    example: { lemma:'ἐσόμενος', class:'part_eimi_fut_mid', meaning:'future participle of εἰμί — about to be' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'gen'],
    cellKeys: ['sg', 'pl'],
    // The appendix abbreviates this table to its nominative and genitive
    // and prints an ellipsis for the rest. Those two rows are what it gives,
    // and they are what is drilled: the remaining accents are not derivable.
    endings: {
      nom: { 'm.sg':'ἐσόμενος', 'm.pl':'ἐσόμενοι', 'f.sg':'ἐσομένη', 'f.pl':'ἐσόμεναι', 'n.sg':'ἐσόμενον', 'n.pl':'ἐσόμενα' },
      gen: { 'm.sg':'ἐσομένου', 'm.pl':'ἐσομένων', 'f.sg':'ἐσομένης', 'f.pl':'ἐσομένων', 'n.sg':'ἐσομένου', 'n.pl':'ἐσομένων' }
    }
  },

  part_eimigo_pres_act: {
    kind: 'adj', label: 'ἰών', literal: true,
    subtitle: 'ἰών — present participle of εἶμι, going',
    example: { lemma:'ἰών', class:'part_eimigo_pres_act', meaning:'present participle of εἶμι, going' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'gen'],
    cellKeys: ['sg', 'pl'],
    // The appendix abbreviates this table to its nominative and genitive
    // and prints an ellipsis for the rest. Those two rows are what it gives,
    // and they are what is drilled: the remaining accents are not derivable.
    endings: {
      nom: { 'm.sg':'ἰών', 'm.pl':'ἰόντες', 'f.sg':'ἰοῦσα', 'f.pl':'ἰοῦσαι', 'n.sg':'ἰόν', 'n.pl':'ἰόντα' },
      gen: { 'm.sg':'ἰόντος', 'm.pl':'ἰόντων', 'f.sg':'ἰούσης', 'f.pl':'ἰουσῶν', 'n.sg':'ἰόντος', 'n.pl':'ἰόντων' }
    }
  },

  part_baino_aor_act: {
    kind: 'adj', label: 'βάς', literal: true,
    subtitle: 'βάς — aorist active participle of βαίνω',
    example: { lemma:'βάς', class:'part_baino_aor_act', meaning:'aorist active participle of βαίνω' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'gen'],
    cellKeys: ['sg', 'pl'],
    // The appendix abbreviates this table to its nominative and genitive
    // and prints an ellipsis for the rest. Those two rows are what it gives,
    // and they are what is drilled: the remaining accents are not derivable.
    endings: {
      nom: { 'm.sg':'βάς', 'm.pl':'βάντες', 'f.sg':'βᾶσα', 'f.pl':'βᾶσαι', 'n.sg':'βάν', 'n.pl':'βάντα' },
      gen: { 'm.sg':'βάντος', 'm.pl':'βάντων', 'f.sg':'βάσης', 'f.pl':'βασῶν', 'n.sg':'βάντος', 'n.pl':'βάντων' }
    }
  },

  part_gignosko_aor_act: {
    kind: 'adj', label: 'γνούς', literal: true,
    subtitle: 'γνούς — aorist active participle of γιγνώσκω',
    example: { lemma:'γνούς', class:'part_gignosko_aor_act', meaning:'aorist active participle of γιγνώσκω' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'gen'],
    cellKeys: ['sg', 'pl'],
    // The appendix abbreviates this table to its nominative and genitive
    // and prints an ellipsis for the rest. Those two rows are what it gives,
    // and they are what is drilled: the remaining accents are not derivable.
    endings: {
      nom: { 'm.sg':'γνούς', 'm.pl':'γνόντες', 'f.sg':'γνοῦσα', 'f.pl':'γνοῦσαι', 'n.sg':'γνόν', 'n.pl':'γνόντα' },
      gen: { 'm.sg':'γνόντος', 'm.pl':'γνόντων', 'f.sg':'γνούσης', 'f.pl':'γνουσῶν', 'n.sg':'γνόντος', 'n.pl':'γνόντων' }
    }
  },

  part_haliskomai_aor_act: {
    kind: 'adj', label: 'ἁλούς', literal: true,
    subtitle: 'ἁλούς — aorist active participle of ἁλίσκομαι',
    example: { lemma:'ἁλούς', class:'part_haliskomai_aor_act', meaning:'aorist active participle of ἁλίσκομαι' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'gen'],
    cellKeys: ['sg', 'pl'],
    // The appendix abbreviates this table to its nominative and genitive
    // and prints an ellipsis for the rest. Those two rows are what it gives,
    // and they are what is drilled: the remaining accents are not derivable.
    endings: {
      nom: { 'm.sg':'ἁλούς', 'm.pl':'ἁλόντες', 'f.sg':'ἁλοῦσα', 'f.pl':'ἁλοῦσαι', 'n.sg':'ἁλόν', 'n.pl':'ἁλόντα' },
      gen: { 'm.sg':'ἁλόντος', 'm.pl':'ἁλόντων', 'f.sg':'ἁλούσης', 'f.pl':'ἁλουσῶν', 'n.sg':'ἁλόντος', 'n.pl':'ἁλόντων' }
    }
  },

  part_oida_perf_act: {
    kind: 'adj', label: 'εἰδώς', literal: true,
    subtitle: 'εἰδώς — perfect participle of οἶδα, knowing',
    example: { lemma:'εἰδώς', class:'part_oida_perf_act', meaning:'perfect participle of οἶδα, knowing' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'm.sg':'εἰδώς', 'm.pl':'εἰδότες', 'f.sg':'εἰδυῖα', 'f.pl':'εἰδυῖαι', 'n.sg':'εἰδός', 'n.pl':'εἰδότα' },
      acc: { 'm.sg':'εἰδότα', 'm.pl':'εἰδότας', 'f.sg':'εἰδυῖαν', 'f.pl':'εἰδυίας', 'n.sg':'εἰδός', 'n.pl':'εἰδότα' },
      gen: { 'm.sg':'εἰδότος', 'm.pl':'εἰδότων', 'f.sg':'εἰδυίας', 'f.pl':'εἰδυιῶν', 'n.sg':'εἰδότος', 'n.pl':'εἰδότων' },
      dat: { 'm.sg':'εἰδότι', 'm.pl':'εἰδόσι(ν)', 'f.sg':'εἰδυίᾳ', 'f.pl':'εἰδυίαις', 'n.sg':'εἰδότι', 'n.pl':'εἰδόσι(ν)' }
    }
  },

  /* ---------------------------------------------------------------------
     BOTH WORDS, WHERE HIS BOOK AND THE DECK TEACH THE SAME PATTERN WITH A
     DIFFERENT ONE.  Karsten's call, 2026-08-22, asked as a question: "any
     harm in keeping both sets? i learn the same stuff right?"

     Nearly. The ENDINGS are identical, so no new grammar is being learnt --
     but Greek accent is persistent, not positional, so ἡμέρας and χώρας put
     it on different syllables and the two really are separate drills. And
     these classes are literal, one word each (see the provenance note at the
     top of this file), so a second word means a second CLASS, not a second
     entry in the vocabulary list.

     The other half of the reason is the check: where the deck and the book
     hold the same word, the book becomes an independent oracle on every cell,
     and this data has otherwise only ever been checked against Wiktionary.
     --------------------------------------------------------------------- */

  decl1_a_long_hemera: {
    kind: 'noun', label: '1st Declension (ᾱ-stem, feminine) — the appendix\'s word', literal: true,
    subtitle: 'ἡμέρα, ἡμέρας — day',
    example: { lemma:'ἡμέρα', class:'decl1_a_long_hemera', meaning:'day' },
    categories: ['nom', 'voc', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'sg':'ἡμέρα', 'pl':'ἡμέραι' },
      voc: { 'sg':'ἡμέρα', 'pl':'ἡμέραι' },
      acc: { 'sg':'ἡμέραν', 'pl':'ἡμέρας' },
      gen: { 'sg':'ἡμέρας', 'pl':'ἡμερῶν' },
      dat: { 'sg':'ἡμέρᾳ', 'pl':'ἡμέραις' }
    }
  },

  decl1_e_psyche: {
    kind: 'noun', label: '1st Declension (η-stem, feminine) — the appendix\'s word', literal: true,
    subtitle: 'ψυχή, ψυχῆς — soul, life',
    example: { lemma:'ψυχή', class:'decl1_e_psyche', meaning:'soul, life' },
    categories: ['nom', 'voc', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'sg':'ψυχή', 'pl':'ψυχαί' },
      voc: { 'sg':'ψυχή', 'pl':'ψυχαί' },
      acc: { 'sg':'ψυχήν', 'pl':'ψυχάς' },
      gen: { 'sg':'ψυχῆς', 'pl':'ψυχῶν' },
      dat: { 'sg':'ψυχῇ', 'pl':'ψυχαῖς' }
    }
  },

  decl1_a_short_doxa: {
    kind: 'noun', label: '1st Declension (ᾰ-stem, feminine) — the appendix\'s word', literal: true,
    subtitle: 'δόξα, δόξης — opinion, glory',
    example: { lemma:'δόξα', class:'decl1_a_short_doxa', meaning:'opinion, reputation, glory' },
    categories: ['nom', 'voc', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'sg':'δόξα', 'pl':'δόξαι' },
      voc: { 'sg':'δόξα', 'pl':'δόξαι' },
      acc: { 'sg':'δόξαν', 'pl':'δόξας' },
      gen: { 'sg':'δόξης', 'pl':'δοξῶν' },
      dat: { 'sg':'δόξῃ', 'pl':'δόξαις' }
    }
  },

  decl1_es_stratiotes: {
    kind: 'noun', label: '1st Declension (masculine, -ης) — the appendix\'s word', literal: true,
    subtitle: 'στρατιώτης, στρατιώτου — soldier',
    example: { lemma:'στρατιώτης', class:'decl1_es_stratiotes', meaning:'soldier' },
    categories: ['nom', 'voc', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'sg':'στρατιώτης', 'pl':'στρατιῶται' },
      voc: { 'sg':'στρατιώτα', 'pl':'στρατιῶται' },
      acc: { 'sg':'στρατιώτην', 'pl':'στρατιώτας' },
      gen: { 'sg':'στρατιώτου', 'pl':'στρατιωτῶν' },
      dat: { 'sg':'στρατιώτῃ', 'pl':'στρατιώταις' }
    }
  },

  decl2_on_ergon: {
    kind: 'noun', label: '2nd Declension (neuter, -ον) — the appendix\'s word', literal: true,
    subtitle: 'ἔργον, ἔργου — work, deed',
    example: { lemma:'ἔργον', class:'decl2_on_ergon', meaning:'work, deed' },
    categories: ['nom', 'voc', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'sg':'ἔργον', 'pl':'ἔργα' },
      voc: { 'sg':'ἔργον', 'pl':'ἔργα' },
      acc: { 'sg':'ἔργον', 'pl':'ἔργα' },
      gen: { 'sg':'ἔργου', 'pl':'ἔργων' },
      dat: { 'sg':'ἔργῳ', 'pl':'ἔργοις' }
    }
  },

  decl3_ma_chrema: {
    kind: 'noun', label: '3rd Declension (neuter, -μα) — the appendix\'s word', literal: true,
    subtitle: 'χρῆμα, χρήματος — thing; (pl.) money',
    example: { lemma:'χρῆμα', class:'decl3_ma_chrema', meaning:'thing; (pl.) money, goods' },
    categories: ['nom', 'voc', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'sg':'χρῆμα', 'pl':'χρήματα' },
      voc: { 'sg':'χρῆμα', 'pl':'χρήματα' },
      acc: { 'sg':'χρῆμα', 'pl':'χρήματα' },
      gen: { 'sg':'χρήματος', 'pl':'χρημάτων' },
      dat: { 'sg':'χρήματι', 'pl':'χρήμασι(ν)' }
    }
  },

  decl3_os_n_etos: {
    kind: 'noun', label: '3rd Declension (-ος, -ους, neuter) — the appendix\'s word', literal: true,
    subtitle: 'ἔτος, ἔτους — year',
    example: { lemma:'ἔτος', class:'decl3_os_n_etos', meaning:'year' },
    categories: ['nom', 'voc', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'sg':'ἔτος', 'pl':'ἔτη' },
      voc: { 'sg':'ἔτος', 'pl':'ἔτη' },
      acc: { 'sg':'ἔτος', 'pl':'ἔτη' },
      gen: { 'sg':'ἔτους', 'pl':'ἐτῶν' },
      dat: { 'sg':'ἔτει', 'pl':'ἔτεσι(ν)' }
    }
  },

  adj_os_h_on_dynatos: {
    kind: 'adj', label: 'Adjectives in -ος, -η, -ον — the appendix\'s word', literal: true,
    subtitle: 'δυνατός, -ή, -όν — able, possible',
    example: { lemma:'δυνατός, -ή, -όν', class:'adj_os_h_on_dynatos', meaning:'able, possible, powerful' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'voc', 'acc', 'gen', 'dat', 'comp', 'sup'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'm.sg':'δυνατός', 'm.pl':'δυνατοί', 'f.sg':'δυνατή', 'f.pl':'δυναταί', 'n.sg':'δυνατόν', 'n.pl':'δυνατά' },
      voc: { 'm.sg':'δυνατέ', 'm.pl':'δυνατοί', 'f.sg':'δυνατή', 'f.pl':'δυναταί', 'n.sg':'δυνατόν', 'n.pl':'δυνατά' },
      acc: { 'm.sg':'δυνατόν', 'm.pl':'δυνατούς', 'f.sg':'δυνατήν', 'f.pl':'δυνατάς', 'n.sg':'δυνατόν', 'n.pl':'δυνατά' },
      gen: { 'm.sg':'δυνατοῦ', 'm.pl':'δυνατῶν', 'f.sg':'δυνατῆς', 'f.pl':'δυνατῶν', 'n.sg':'δυνατοῦ', 'n.pl':'δυνατῶν' },
      dat: { 'm.sg':'δυνατῷ', 'm.pl':'δυνατοῖς', 'f.sg':'δυνατῇ', 'f.pl':'δυναταῖς', 'n.sg':'δυνατῷ', 'n.pl':'δυνατοῖς' },
      // Comparative and superlative. Every adjective table in the appendix
      // carries these two rows and the deck had not one of them, which made
      // comparison the single most examinable thing missing (pp.327-329).
      // Only the nominative singular is printed, so only that is drilled:
      // the comparative declines like a 2-1-2 adjective, but deriving its
      // other cells means deriving accents, which this file does not do.
      // Two-termination adjectives are printed masculine and feminine
      // together (ἀληθέστερος, ἀληθεστέρα); both are accepted.
      comp: { 'm.sg':'δυνατώτερος', 'f.sg':'δυνατωτέρα', 'n.sg':'δυνατώτερον' },
      sup:  { 'm.sg':'δυνατώτατος', 'f.sg':'δυνατωτάτη', 'n.sg':'δυνατώτατον' }
    }
  },

  adj_ys_eia_y_hedys: {
    kind: 'adj', label: 'Adjectives in -ύς, -εῖα, -ύ — the appendix\'s word', literal: true,
    subtitle: 'ἡδύς, ἡδεῖα, ἡδύ — sweet, pleasant',
    example: { lemma:'ἡδύς, -εῖα, -ύ', class:'adj_ys_eia_y_hedys', meaning:'sweet, pleasant' },
    genders: ['m', 'f', 'n'],
    categories: ['nom', 'voc', 'acc', 'gen', 'dat'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'm.sg':'ἡδύς', 'm.pl':'ἡδεῖς', 'f.sg':'ἡδεῖα', 'f.pl':'ἡδεῖαι', 'n.sg':'ἡδύ', 'n.pl':'ἡδέα' },
      voc: { 'm.sg':'ἡδύ', 'm.pl':'ἡδεῖς', 'f.sg':'ἡδεῖα', 'f.pl':'ἡδεῖαι', 'n.sg':'ἡδύ', 'n.pl':'ἡδέα' },
      acc: { 'm.sg':'ἡδύν', 'm.pl':'ἡδεῖς', 'f.sg':'ἡδεῖαν', 'f.pl':'ἡδείας', 'n.sg':'ἡδύ', 'n.pl':'ἡδέα' },
      gen: { 'm.sg':'ἡδέως', 'm.pl':'ἡδέων', 'f.sg':'ἡδείας', 'f.pl':'ἡδειῶν', 'n.sg':'ἡδέως', 'n.pl':'ἡδέων' },
      dat: { 'm.sg':'ἡδεῖ', 'm.pl':'ἡδέσι', 'f.sg':'ἡδείᾳ', 'f.pl':'ἡδείαις', 'n.sg':'ἡδεῖ', 'n.pl':'ἡδέσι' }
    }
  },

  adj_wn_on_eudaimon: {
    kind: 'adj', label: 'Adjectives in -ων, -ον — the appendix\'s word', literal: true,
    subtitle: 'εὐδαίμων, εὔδαιμον — fortunate, happy',
    example: { lemma:'εὐδαίμων, -ον', class:'adj_wn_on_eudaimon', meaning:'fortunate, happy, blessed' },
    genders: ['mf', 'n'],
    categories: ['nom', 'voc', 'acc', 'gen', 'dat', 'comp', 'sup'],
    cellKeys: ['sg', 'pl'],
    endings: {
      nom: { 'mf.sg':'εὐδαίμων', 'mf.pl':'εὐδαίμονες', 'n.sg':'εὔδαιμον', 'n.pl':'εὐδαίμονα' },
      voc: { 'mf.sg':'εὔδαιμον', 'mf.pl':'εὐδαίμονες', 'n.sg':'εὔδαιμον', 'n.pl':'εὐδαίμονα' },
      acc: { 'mf.sg':'εὐδαίμονα', 'mf.pl':'εὐδαίμονας', 'n.sg':'εὔδαιμον', 'n.pl':'εὐδαίμονα' },
      gen: { 'mf.sg':'εὐδαίμονος', 'mf.pl':'εὐδαιμόνων', 'n.sg':'εὐδαίμονος', 'n.pl':'εὐδαιμόνων' },
      dat: { 'mf.sg':'εὐδαίμονι', 'mf.pl':'εὐδαίμοσι(ν)', 'n.sg':'εὐδαίμονι', 'n.pl':'εὐδαίμοσι(ν)' },
      // Comparative and superlative. Every adjective table in the appendix
      // carries these two rows and the deck had not one of them, which made
      // comparison the single most examinable thing missing (pp.327-329).
      // Only the nominative singular is printed, so only that is drilled:
      // the comparative declines like a 2-1-2 adjective, but deriving its
      // other cells means deriving accents, which this file does not do.
      // Two-termination adjectives are printed masculine and feminine
      // together (ἀληθέστερος, ἀληθεστέρα); both are accepted.
      comp: { 'mf.sg':['εὐδαιμονέστερος','εὐδαιμονεστέρα'], 'n.sg':'εὐδαιμονέστερον' },
      sup:  { 'mf.sg':['εὐδαιμονέστατος','εὐδαιμονεστάτη'], 'n.sg':'εὐδαιμονέστατον' }
    }
  },

  /* ---------------------------------------------------------------------
     IRREGULAR COMPARISON (p.329).  Twelve positives with their comparatives
     and superlatives -- ἀγαθός/ἀμείνων/ἄριστος down to ταχύς/θάττων/τάχιστος.
     The deck had none of it.

     These are the only classes in the file whose cell is not a case or a
     person: the appendix prints citation forms, not paradigms, so the card is
     "ἀγαθός -- comparative?" and every form the page offers is accepted. The
     cell key `cit` follows the infinitive's precedent, which labels itself
     with an em dash because it has no person or number to name.

     Transcribed by hand rather than parsed: a cell here runs to three lines
     and the positive sits in the middle of its own, so which comparative
     belongs to which positive is decided by the Greek and not by the layout --
     ἥκιστα sits one line under κακός and belongs to it, while the identically
     placed line under μέγας belongs to μικρός. A parser would have produced a
     clean, plausible, wrong table. check_irregular() in
     tools/appendix/extract.py holds the transcription against the page.

     κακός's superlative is printed χείρσιτος on p.329, letters transposed for
     χείριστος, and ῥᾷον with a Latin o. Both are stored AS PRINTED, because
     unlike the paradigm cells nothing else in the suite cross-checks them;
     they are listed in extract.py's header.
     --------------------------------------------------------------------- */

  cmp_agathos: {
    kind: 'noun', label: 'Comparison: ἀγαθός', literal: true,
    subtitle: 'ἀγαθός, -ή, -όν — ἀμείνων, -ον / βελτίων, -ον / κρείττων, -ον — ἄριστος, -η, -ον / βέλτιστος, -η, -ον / κράτιστος, -η, -ον',
    example: { lemma:'ἀγαθός', class:'cmp_agathos', meaning:'comparative and superlative of ἀγαθός' },
    categories: ['comp', 'sup'],
    cellKeys: ['cit'],
    endings: {
      comp: { 'cit':['ἀμείνων','βελτίων','κρείττων'] },
      sup:  { 'cit':['ἄριστος','βέλτιστος','κράτιστος'] }
    }
  },

  cmp_kakos: {
    kind: 'noun', label: 'Comparison: κακός', literal: true,
    subtitle: 'κακός, -ή, -όν — κακίων, -ον / χείρων, -ον / ἥττων, -ον — κάκιστος, -η, -ον / χείρσιτος, -η, -ον / ἥκιστα (adv.)',
    example: { lemma:'κακός', class:'cmp_kakos', meaning:'comparative and superlative of κακός' },
    categories: ['comp', 'sup'],
    cellKeys: ['cit'],
    endings: {
      comp: { 'cit':['κακίων','χείρων','ἥττων'] },
      // χείριστος first, χείρσιτος second: p.329 prints the letters transposed,
      // and storing only what it prints would have rejected the correct spelling
      // while accepting the typo. Both are graded right; the table shows the first.
      sup:  { 'cit':['χείριστος','κάκιστος','χείρσιτος','ἥκιστα'] }
    }
  },

  cmp_aischros: {
    kind: 'noun', label: 'Comparison: αἰσχρός', literal: true,
    subtitle: 'αἰσχρός, -ά, -όν — αἰσχίων, -ον — αἴσχιστος, -η, -ον',
    example: { lemma:'αἰσχρός', class:'cmp_aischros', meaning:'comparative and superlative of αἰσχρός' },
    categories: ['comp', 'sup'],
    cellKeys: ['cit'],
    endings: {
      comp: { 'cit':'αἰσχίων' },
      sup:  { 'cit':'αἴσχιστος' }
    }
  },

  cmp_echthros: {
    kind: 'noun', label: 'Comparison: ἐχθρός', literal: true,
    subtitle: 'ἐχθρός, -ά, -όν — ἐχθίων, -ον — ἔχθιστος, -η, -ον',
    example: { lemma:'ἐχθρός', class:'cmp_echthros', meaning:'comparative and superlative of ἐχθρός' },
    categories: ['comp', 'sup'],
    cellKeys: ['cit'],
    endings: {
      comp: { 'cit':'ἐχθίων' },
      sup:  { 'cit':'ἔχθιστος' }
    }
  },

  cmp_hedys: {
    kind: 'noun', label: 'Comparison: ἡδύς', literal: true,
    subtitle: 'ἡδύς, -εῖα, -ύ — ἡδίων, -ον — ἥδιστος, -η, -ον',
    example: { lemma:'ἡδύς', class:'cmp_hedys', meaning:'comparative and superlative of ἡδύς' },
    categories: ['comp', 'sup'],
    cellKeys: ['cit'],
    endings: {
      comp: { 'cit':'ἡδίων' },
      sup:  { 'cit':'ἥδιστος' }
    }
  },

  cmp_kalos: {
    kind: 'noun', label: 'Comparison: καλός', literal: true,
    subtitle: 'καλός, -ή, -όν — καλλίων, -ον — κάλλιστος, -η, -ον',
    example: { lemma:'καλός', class:'cmp_kalos', meaning:'comparative and superlative of καλός' },
    categories: ['comp', 'sup'],
    cellKeys: ['cit'],
    endings: {
      comp: { 'cit':'καλλίων' },
      sup:  { 'cit':'κάλλιστος' }
    }
  },

  cmp_megas: {
    kind: 'noun', label: 'Comparison: μέγας', literal: true,
    subtitle: 'μέγας, μεγάλη, μέγα — μείζων, -ον — μέγιστος, -η, -ον',
    example: { lemma:'μέγας', class:'cmp_megas', meaning:'comparative and superlative of μέγας' },
    categories: ['comp', 'sup'],
    cellKeys: ['cit'],
    endings: {
      comp: { 'cit':'μείζων' },
      sup:  { 'cit':'μέγιστος' }
    }
  },

  cmp_mikros: {
    kind: 'noun', label: 'Comparison: μικρός', literal: true,
    subtitle: 'μικρός, -ά, -όν — μικρότερος, -α, -ον (reg.) / ἐλάττων, -ον / ἥττων, -ον — μικρότατος, -η, -ον (reg.) / ἐλάχιστος, -η, -ον / ἥκιστα (adv.)',
    example: { lemma:'μικρός', class:'cmp_mikros', meaning:'comparative and superlative of μικρός' },
    categories: ['comp', 'sup'],
    cellKeys: ['cit'],
    endings: {
      comp: { 'cit':['μικρότερος','ἐλάττων','ἥττων'] },
      sup:  { 'cit':['μικρότατος','ἐλάχιστος','ἥκιστα'] }
    }
  },

  cmp_oligos: {
    kind: 'noun', label: 'Comparison: ὀλίγος', literal: true,
    subtitle: 'ὀλίγος, -η, -ον — μείων, -ον / ἐλάττων, -ον / ἥττων, -ον — ὀλίγιστος, -η, -ον / ἐλάχιστος, -η, -ον / ἥκιστα (adv.)',
    example: { lemma:'ὀλίγος', class:'cmp_oligos', meaning:'comparative and superlative of ὀλίγος' },
    categories: ['comp', 'sup'],
    cellKeys: ['cit'],
    endings: {
      comp: { 'cit':['μείων','ἐλάττων','ἥττων'] },
      sup:  { 'cit':['ὀλίγιστος','ἐλάχιστος','ἥκιστα'] }
    }
  },

  cmp_polys: {
    kind: 'noun', label: 'Comparison: πολύς', literal: true,
    subtitle: 'πολύς, πολλή, πολύ — πλείων, -ον/πλέων, -ον — πλεῖστος, -η, -ον',
    example: { lemma:'πολύς', class:'cmp_polys', meaning:'comparative and superlative of πολύς' },
    categories: ['comp', 'sup'],
    cellKeys: ['cit'],
    endings: {
      // p.329 prints this one as "πλείων, -ον/πλέων, -ον" -- two spellings
      // inside a single cell, where every other row separates alternatives
      // by line. Both are Attic and both are accepted.
      comp: { 'cit':['πλείων','πλέων'] },
      sup:  { 'cit':'πλεῖστος' }
    }
  },

  cmp_rhadios: {
    kind: 'noun', label: 'Comparison: ῥάδιος', literal: true,
    subtitle: 'ῥάδιος, -α, -ον — ῥᾴων, ῥᾷoν — ῥᾷστος, -η, -ον',
    example: { lemma:'ῥάδιος', class:'cmp_rhadios', meaning:'comparative and superlative of ῥάδιος' },
    categories: ['comp', 'sup'],
    cellKeys: ['cit'],
    endings: {
      // p.329 prints "ῥᾴων, ῥᾷoν" with a LATIN o in the neuter, so only the
      // masculine is stored here -- ῥᾷον with a Greek omicron is right and is
      // added rather than the page's spelling, which no keyboard produces.
      comp: { 'cit':['ῥᾴων','ῥᾷον'] },
      sup:  { 'cit':'ῥᾷστος' }
    }
  },

  cmp_tachys: {
    kind: 'noun', label: 'Comparison: ταχύς', literal: true,
    subtitle: 'ταχύς, ταχεῖα, ταχύ — θάττων, θᾶττον — τάχιστος, -η, -ον',
    example: { lemma:'ταχύς', class:'cmp_tachys', meaning:'comparative and superlative of ταχύς' },
    categories: ['comp', 'sup'],
    cellKeys: ['cit'],
    endings: {
      comp: { 'cit':'θάττων' },
      sup:  { 'cit':'τάχιστος' }
    }
  },

  /* =====================================================================
     THE SEVEN VERBS THE APPENDIX PRINTS AND THIS FILE HAD NO ENTRY FOR.

     Generated by tools/appendix/gen_verbs.py from "Grammar Tables.pdf",
     so each class holds exactly the systems his page prints and no more:
     ἀπόλλυμι and μίγνυμι get their present system, κεῖμαι its
     middle/passive present system, and βαίνω, γιγνώσκω and ἁλίσκομαι
     nothing but their root aorist — which is the only thing any of the
     three is drilled on, and the reason the appendix gives each a page.

     ἐρωτάω is his -άω exemplar. τιμάω above teaches the same pattern, and
     stays: the two differ in accent, and having both is what lets the book
     check the deck cell by cell (see the note on the paired exemplars).
     ἐρωτάω deliberately arrives WITHOUT the perfect moods and the future
     perfect that τιμάω once had — the appendix prints none of them for any
     ω-verb, and τιμάω's are in data/greek-archive.js.

     Departures from the printed page are listed in the generator's
     VERB_FIXES with reasons and adjudicated in tests/tests.js. The one
     worth knowing: p.342 prints μίγνυμι's imperfect with no augment, in
     the same rows where ἀπόλλυμι has ἀπώλλυον and δείκνυμι ἐδείκνυν.
     Caught by putting the three -νυμι verbs side by side, which is how
     δόθηθι and τέθητι were caught as well.
     ===================================================================== */

  contract_aw_erotao: {
    kind: 'verb', label: 'Contract verbs in -άω — the appendix\'s word', literal: true,
    subtitle: 'ἐρωτάω, ἐρωτήσω — to ask',
    example: { lemma:'ἐρωτάω', class:'contract_aw_erotao', meaning:'to ask, question' },
    categories: ['pres.act', 'impf.act', 'impf.mp', 'fut.act', 'fut.mid', 'fut.pass', 'aor.act', 'aor.mid', 'aor.pass', 'perf.act', 'perf.mp', 'plup.act', 'plup.mp', 'pres.act.subj', 'pres.act.opt', 'pres.act.imper', 'pres.mp.subj', 'pres.mp.opt', 'pres.mp.imper', 'fut.act.opt', 'fut.mid.opt', 'aor.act.subj', 'aor.act.opt', 'aor.act.imper', 'aor.mid.subj', 'aor.mid.opt', 'aor.mid.imper', 'aor.pass.subj', 'aor.pass.opt', 'pres.act.inf', 'pres.mp.inf', 'fut.act.inf', 'fut.mid.inf', 'fut.pass.inf', 'aor.act.inf', 'aor.mid.inf', 'aor.pass.inf', 'perf.act.inf', 'perf.mp.inf'],
    cellKeys: ['1sg','2sg','3sg','1pl','2pl','3pl'],
    endings: {
      'pres.act': { '1sg':'ἐρωτῶ', '2sg':'ἐρωτᾷς', '3sg':'ἐρωτᾷ', '1pl':'ἐρωτῶμεν', '2pl':'ἐρωτᾶτε', '3pl':'ἐρωτῶσι(ν)' },
      'impf.act': { '1sg':'ἠρώτων', '2sg':'ἠρώτας', '3sg':'ἠρώτα', '1pl':'ἠρωτῶμεν', '2pl':'ἠρωτᾶτε', '3pl':'ἠρώτων' },
      'impf.mp': { '1sg':'ἠρωτώμην', '2sg':'ἠρωτῶ', '3sg':'ἠρωτᾶτο', '1pl':'ἠρωτώμεθα', '2pl':'ἠρωτᾶσθε', '3pl':'ἠρωτῶντο' },
      'fut.act': { '1sg':'ἐρωτήσω', '2sg':'ἐρωτήσεις', '3sg':'ἐρωτήσει', '1pl':'ἐρωτήσομεν', '2pl':'ἐρωτήσετε', '3pl':'ἐρωτήσουσι(ν)' },
      'fut.mid': { '1sg':'ἐρωτήσομαι', '2sg':['ἐρωτήσῃ','ἐρωτήσει'], '3sg':'ἐρωτήσεται', '1pl':'ἐρωτησόμεθα', '2pl':'ἐρωτήσεσθε', '3pl':'ἐρωτήσονται' },
      'fut.pass': { '1sg':'ἐρωτηθήσομαι', '2sg':['ἐρωτηθήσῃ','ἐρωτηθήσει'], '3sg':'ἐρωτηθήσεται', '1pl':'ἐρωτηθησόμεθα', '2pl':'ἐρωτηθήσεσθε', '3pl':'ἐρωτηθήσονται' },
      'aor.act': { '1sg':'ἠρώτησα', '2sg':'ἠρώτησας', '3sg':'ἠρώτησε(ν)', '1pl':'ἠρωτήσαμεν', '2pl':'ἠρωτήσατε', '3pl':'ἠρώτησαν' },
      'aor.mid': { '1sg':'ἠρωτησάμην', '2sg':'ἠρωτήσω', '3sg':'ἠρωτήσατο', '1pl':'ἠρωτησάμεθα', '2pl':'ἠρωτήσασθε', '3pl':'ἠρωτήσαντο' },
      'aor.pass': { '1sg':'ἠρωτήθην', '2sg':'ἠρωτήθης', '3sg':'ἠρωτήθη', '1pl':'ἠρωτήθημεν', '2pl':'ἠρωτήθητε', '3pl':'ἠρωτήθησαν' },
      'perf.act': { '1sg':'ἠρώτηκα', '2sg':'ἠρώτηκας', '3sg':'ἠρώτηκε(ν)', '1pl':'ἠρωτήκαμεν', '2pl':'ἠρωτήκατε', '3pl':'ἠρωτήκασι(ν)' },
      'perf.mp': { '1sg':'ἠρώτημαι', '2sg':'ἠρώτησαι', '3sg':'ἠρώτηται', '1pl':'ἠρωτήμεθα', '2pl':'ἠρώτησθε', '3pl':'ἠρώτηνται' },
      'plup.act': { '1sg':'ἠρωτήκη', '2sg':'ἠρωτήκης', '3sg':'ἠρωτήκει(ν)', '1pl':'ἠρωτήκεμεν', '2pl':'ἠρωτήκετε', '3pl':'ἠρωτήκεσαν' },
      'plup.mp': { '1sg':'ἠρωτήμην', '2sg':'ἠρώτησο', '3sg':'ἠρώτητο', '1pl':'ἠρωτήμεθα', '2pl':'ἠρώτησθε', '3pl':'ἠρώτηντο' },
      'pres.act.subj': { '1sg':'ἐρωτῶ', '2sg':'ἐρωτᾷς', '3sg':'ἐρωτᾷ', '1pl':'ἐρωτῶμεν', '2pl':'ἐρωτᾶτε', '3pl':'ἐρωτῶσι(ν)' },
      'pres.act.opt': { '1sg':['ἐρωτῴην','ἐρωτῷμι'], '2sg':['ἐρωτῴης','ἐρωτῷς'], '3sg':['ἐρωτῴη','ἐρωτῷ'], '1pl':['ἐρωτῷμεν','ἐρωτῴημεν'], '2pl':['ἐρωτῷτε','ἐρωτῴητε'], '3pl':['ἐρωτῷεν','ἐρωτῴησαν'] },
      'pres.act.imper': { '2sg':'ἐρώτα', '3sg':'ἐρωτάτω', '2pl':'ἐρωτᾶτε', '3pl':'ἐρωτώντων' },
      'pres.mp.subj': { '1sg':'ἐρωτῶμαι', '2sg':'ἐρωτᾷ', '3sg':'ἐρωτᾶται', '1pl':'ἐρωτώμεθα', '2pl':'ἐρωτᾶσθε', '3pl':'ἐρωτῶνται' },
      'pres.mp.opt': { '1sg':'ἐρωτῴμην', '2sg':'ἐρωτῷο', '3sg':'ἐρωτῷτο', '1pl':'ἐρωτῴμεθα', '2pl':'ἐρωτῷσθε', '3pl':'ἐρωτῷντο' },
      'pres.mp.imper': { '2sg':'ἐρωτῶ', '3sg':'ἐρωτάσθω', '2pl':'ἐρωτᾶσθε', '3pl':'ἐρωτάσθων' },
      'fut.act.opt': { '1sg':'ἐρωτήσοιμι', '2sg':'ἐρωτήσοις', '3sg':'ἐρωτήσοι', '1pl':'ἐρωτήσοιμεν', '2pl':'ἐρωτήσοιτε', '3pl':'ἐρωτήσοιεν' },
      'fut.mid.opt': { '1sg':'ἐρωτησοίμην', '2sg':'ἐρωτήσοιο', '3sg':'ἐρωτήσοιτο', '1pl':'ἐρωτησοίμεθα', '2pl':'ἐρωτήσοισθε', '3pl':'ἐρωτήσοιντο' },
      'aor.act.subj': { '1sg':'ἐρωτήσω', '2sg':'ἐρωτήσῃς', '3sg':'ἐρωτήσῃ', '1pl':'ἐρωτήσωμεν', '2pl':'ἐρωτήσητε', '3pl':'ἐρωτήσωσι(ν)' },
      'aor.act.opt': { '1sg':'ἐρωτήσαιμι', '2sg':['ἐρωτήσαις','ἐρωτήσειας'], '3sg':['ἐρωτήσαι','ἐρωτήσειε(ν)'], '1pl':'ἐρωτήσαιμεν', '2pl':'ἐρωτήσαιτε', '3pl':['ἐρωτήσαιεν','ἐρωτήσειαν'] },
      'aor.act.imper': { '2sg':'ἐρώτησον', '3sg':'ἐρωτησάτω', '2pl':'ἐρωτήσατε', '3pl':'ἐρωτησάντων' },
      'aor.mid.subj': { '1sg':'ἐρωτήσωμαι', '2sg':'ἐρωτήσῃ', '3sg':'ἐρωτήσηται', '1pl':'ἐρωτησώμεθα', '2pl':'ἐρωτήσησθε', '3pl':'ἐρωτήσωνται' },
      'aor.mid.opt': { '1sg':'ἐρωτησαίμην', '2sg':'ἐρωτήσαιο', '3sg':'ἐρωτήσαιτο', '1pl':'ἐρωτησαίμεθα', '2pl':'ἐρωτήσαισθε', '3pl':'ἐρωτήσαιντο' },
      'aor.mid.imper': { '2sg':'ἐρώτησαι', '3sg':'ἐρωτησάσθω', '2pl':'ἐρωτήσασθε', '3pl':'ἐρωτησάσθων' },
      'aor.pass.subj': { '1sg':'ἐρωτηθῶ', '2sg':'ἐρωτηθῇς', '3sg':'ἐρωτηθῇ', '1pl':'ἐρωτηθῶμεν', '2pl':'ἐρωτηθῆτε', '3pl':'ἐρωτηθῶσι(ν)' },
      'aor.pass.opt': { '1sg':'ἐρωτηθείην', '2sg':'ἐρωτηθείης', '3sg':'ἐρωτηθείη', '1pl':['ἐρωτηθείημεν','ἐρωτηθεῖμεν'], '2pl':['ἐρωτηθείητε','ἐρωτηθεῖτε'], '3pl':['ἐρωτηθείησαν','ἐρωτηθεῖεν'] },
      'pres.act.inf': { inf:'ἐρωτᾶν' },
      'pres.mp.inf': { inf:'ἐρωτᾶσθαι' },
      'fut.act.inf': { inf:'ἐρωτήσειν' },
      'fut.mid.inf': { inf:'ἐρωτήσεσθαι' },
      'fut.pass.inf': { inf:'ἐρωτηθήσεσθαι' },
      'aor.act.inf': { inf:'ἐρωτῆσαι' },
      'aor.mid.inf': { inf:'ἐρωτήσασθαι' },
      'aor.pass.inf': { inf:'ἐρωτηθῆναι' },
      'perf.act.inf': { inf:'ἠρωτηκέναι' },
      'perf.mp.inf': { inf:'ἠρωτῆσθαι' }
    }
  },

  athematic_apollymi: {
    kind: 'verb', label: 'ἀπόλλυμι (to destroy)', literal: true,
    subtitle: 'ἀπόλλυμι — to destroy, lose; present system only, as the appendix prints it',
    example: { lemma:'ἀπόλλυμι', class:'athematic_apollymi', meaning:'to destroy, ruin, lose' },
    categories: ['pres.act', 'pres.mp', 'impf.act', 'impf.mp', 'pres.act.subj', 'pres.act.opt', 'pres.act.imper', 'pres.mp.subj', 'pres.mp.opt', 'pres.mp.imper', 'pres.act.inf', 'pres.mp.inf'],
    cellKeys: ['1sg','2sg','3sg','1pl','2pl','3pl'],
    endings: {
      'pres.act': { '1sg':'ἀπόλλυμι', '2sg':'ἀπόλλυς', '3sg':'ἀπόλλυσι(ν)', '1pl':'ἀπόλλυμεν', '2pl':'ἀπόλλυτε', '3pl':'ἀπολλύασι(ν)' },
      'pres.mp': { '1sg':'ἀπόλλυμαι', '2sg':'ἀπόλλυσαι', '3sg':'ἀπόλλυται', '1pl':'ἀπολλύμεθα', '2pl':'ἀπόλλυσθε', '3pl':'ἀπόλλυνται' },
      'impf.act': { '1sg':'ἀπώλλυον', '2sg':'ἀπώλλυες', '3sg':'ἀπώλλυε', '1pl':'ἀπώλλυμεν', '2pl':'ἀπώλλυτε', '3pl':'ἀπώλλυον' },
      'impf.mp': { '1sg':'ἀπωλλύμην', '2sg':'ἀπώλλυσο', '3sg':'ἀπώλλυτο', '1pl':'ἀπωλλύμεθα', '2pl':'ἀπώλλυσθε', '3pl':'ἀπώλλυντο' },
      'pres.act.subj': { '1sg':'ἀπολλύω', '2sg':'ἀπολλύῃς', '3sg':'ἀπολλύῃ', '1pl':'ἀπολλύωμεν', '2pl':'ἀπολλύητε', '3pl':'ἀπολλύωσι(ν)' },
      'pres.act.opt': { '1sg':'ἀπολλύοιμι', '2sg':'ἀπολλύοις', '3sg':'ἀπολλύοι', '1pl':'ἀπολλύοιμεν', '2pl':'ἀπολλύοιτε', '3pl':'ἀπολλύοιεν' },
      'pres.act.imper': { '2sg':'ἀπόλλυ', '3sg':'ἀπολλύτω', '2pl':'ἀπόλλυτε', '3pl':'ἀπολλύντων' },
      'pres.mp.subj': { '1sg':'ἀπολλύωμαι', '2sg':'ἀπολλύῃ', '3sg':'ἀπολλύηται', '1pl':'ἀπολλυώμεθα', '2pl':'ἀπολλύησθε', '3pl':'ἀπολλύωνται' },
      'pres.mp.opt': { '1sg':'ἀπολλυοίμην', '2sg':'ἀπολλύοιο', '3sg':'ἀπολλύοιτο', '1pl':'ἀπολλυοίμεθα', '2pl':'ἀπολλύοισθε', '3pl':'ἀπολλύοιντο' },
      'pres.mp.imper': { '2sg':'ἀπόλλυσο', '3sg':'ἀπολλύσθω', '2pl':'ἀπόλλυσθε', '3pl':'ἀπολλύσθων' },
      'pres.act.inf': { inf:'ἀπολλύναι' },
      'pres.mp.inf': { inf:'ἀπόλλυσθαι' }
    }
  },

  athematic_mignymi: {
    kind: 'verb', label: 'μίγνυμι (to mix)', literal: true,
    subtitle: 'μίγνυμι — to mix; present system only, as the appendix prints it',
    example: { lemma:'μίγνυμι', class:'athematic_mignymi', meaning:'to mix, mingle' },
    categories: ['pres.act', 'pres.mp', 'impf.act', 'impf.mp', 'pres.act.subj', 'pres.act.opt', 'pres.act.imper', 'pres.mp.subj', 'pres.mp.opt', 'pres.mp.imper', 'pres.act.inf', 'pres.mp.inf'],
    cellKeys: ['1sg','2sg','3sg','1pl','2pl','3pl'],
    endings: {
      'pres.act': { '1sg':'μίγνυμι', '2sg':'μίγνυς', '3sg':'μίγνυσι(ν)', '1pl':'μίγνυμεν', '2pl':'μίγνυτε', '3pl':'μιγνύασι(ν)' },
      'pres.mp': { '1sg':'μίγνυμαι', '2sg':'μίγνυσαι', '3sg':'μίγνυται', '1pl':'μιγνύμεθα', '2pl':'μίγνυσθε', '3pl':'μίγνυνται' },
      'impf.act': { '1sg':'ἐμίγνυν', '2sg':'ἐμίγνυς', '3sg':'ἐμίγνυ', '1pl':'ἐμίγνυμεν', '2pl':'ἐμίγνυτε', '3pl':'ἐμίγνυσαν' },
      'impf.mp': { '1sg':'ἐμιγνύμην', '2sg':'ἐμίγνυσο', '3sg':'ἐμίγνυτο', '1pl':'ἐμιγνύμεθα', '2pl':'ἐμίγνυσθε', '3pl':'ἐμίγνυντο' },
      'pres.act.subj': { '1sg':'μιγνύω', '2sg':'μιγνύῃς', '3sg':'μιγνύῃ', '1pl':'μιγνύωμεν', '2pl':'μιγνύητε', '3pl':'μιγνύωσι(ν)' },
      'pres.act.opt': { '1sg':'μιγνύοιμι', '2sg':'μιγνύοις', '3sg':'μιγνύοι', '1pl':'μιγνύοιμεν', '2pl':'μιγνύοιτε', '3pl':'μιγνύοιεν' },
      'pres.act.imper': { '2sg':'μίγνυ', '3sg':'μιγνύτω', '2pl':'μίγνυτε', '3pl':'μιγνύντων' },
      'pres.mp.subj': { '1sg':'μιγνύωμαι', '2sg':'μιγνύῃ', '3sg':'μιγνύηται', '1pl':'μιγνυώμεθα', '2pl':'μιγνύησθε', '3pl':'μιγνύωνται' },
      'pres.mp.opt': { '1sg':'μιγνυοίμην', '2sg':'μιγνύοιο', '3sg':'μιγνύοιτο', '1pl':'μιγνυοίμεθα', '2pl':'μιγνύοισθε', '3pl':'μιγνύοιντο' },
      'pres.mp.imper': { '2sg':'μίγνυσο', '3sg':'μιγνύσθω', '2pl':'μίγνυσθε', '3pl':'μιγνύσθων' },
      'pres.act.inf': { inf:'μιγνύναι' },
      'pres.mp.inf': { inf:'μίγνυσθαι' }
    }
  },

  athematic_keimai: {
    kind: 'verb', label: 'κεῖμαι (to lie, be laid down)', literal: true,
    subtitle: 'κεῖμαι — middle/passive throughout; it serves as the perfect passive of τίθημι',
    example: { lemma:'κεῖμαι', class:'athematic_keimai', meaning:'to lie, be laid down' },
    categories: ['pres.mp', 'impf.mp', 'pres.mp.subj', 'pres.mp.opt', 'pres.mp.imper', 'pres.mp.inf'],
    cellKeys: ['1sg','2sg','3sg','1pl','2pl','3pl'],
    endings: {
      'pres.mp': { '1sg':'κεῖμαι', '2sg':'κεῖσαι', '3sg':'κεῖται', '1pl':'κείμεθα', '2pl':'κεῖσθε', '3pl':'κεῖνται' },
      'impf.mp': { '1sg':'ἐκείμην', '2sg':'ἔκεισο', '3sg':'ἔκειτο', '1pl':'ἐκείμεθα', '2pl':'ἔκεισθε', '3pl':'ἔκειντο' },
      'pres.mp.subj': { '1sg':'κέωμαι', '2sg':'κέῃ', '3sg':'κέηται', '1pl':'κεώμεθα', '2pl':'κέησθε', '3pl':'κέωνται' },
      'pres.mp.opt': { '1sg':'κεοίμην', '2sg':'κέοιο', '3sg':'κέοιτο', '1pl':'κεοίμεθα', '2pl':'κέοισθε', '3pl':'κέοιντο' },
      'pres.mp.imper': { '2sg':'κεῖσο', '3sg':'κείσθω', '2pl':'κεῖσθε', '3pl':'κείσθων' },
      'pres.mp.inf': { inf:'κεῖσθαι' }
    }
  },

  athaor_baino: {
    kind: 'verb', label: 'Athematic aorist — βαίνω', literal: true,
    subtitle: 'ἔβην — the root aorist of βαίνω, "I went"',
    example: { lemma:'βαίνω', class:'athaor_baino', meaning:'to go, walk, step' },
    categories: ['aor.act', 'aor.act.subj', 'aor.act.opt', 'aor.act.imper', 'aor.act.inf'],
    cellKeys: ['1sg','2sg','3sg','1pl','2pl','3pl'],
    endings: {
      'aor.act': { '1sg':'ἔβην', '2sg':'ἔβης', '3sg':'ἔβη', '1pl':'ἔβημεν', '2pl':'ἔβητε', '3pl':'ἔβησαν' },
      'aor.act.subj': { '1sg':'βῶ', '2sg':'βῇς', '3sg':'βῇ', '1pl':'βῶμεν', '2pl':'βῆτε', '3pl':'βῶσι(ν)' },
      'aor.act.opt': { '1sg':['βαίην','βαῖμι'], '2sg':['βαίης','βαῖς'], '3sg':['βαίη','βαῖ'], '1pl':['βαῖμεν','βαίημεν'], '2pl':['βαῖτε','βαίητε'], '3pl':['βαῖεν','βαίησαν'] },
      'aor.act.imper': { '2sg':'βῆθι', '3sg':'βήτω', '2pl':'βῆτε', '3pl':'βάντων' },
      'aor.act.inf': { inf:'βῆναι' }
    }
  },

  athaor_gignosko: {
    kind: 'verb', label: 'Athematic aorist — γιγνώσκω', literal: true,
    subtitle: 'ἔγνων — the root aorist of γιγνώσκω, "I came to know"',
    example: { lemma:'γιγνώσκω', class:'athaor_gignosko', meaning:'to know, recognise' },
    categories: ['aor.act', 'aor.act.subj', 'aor.act.opt', 'aor.act.imper', 'aor.act.inf'],
    cellKeys: ['1sg','2sg','3sg','1pl','2pl','3pl'],
    endings: {
      'aor.act': { '1sg':'ἔγνων', '2sg':'ἔγνως', '3sg':'ἔγνω', '1pl':'ἔγνωμεν', '2pl':'ἔγνωτε', '3pl':'ἔγνωσαν' },
      'aor.act.subj': { '1sg':'γνῶ', '2sg':'γνῷς', '3sg':'γνῷ', '1pl':'γνῶμεν', '2pl':'γνῶτε', '3pl':'γνῶσι(ν)' },
      'aor.act.opt': { '1sg':['γνοίην','γνοῖμι'], '2sg':['γνοίης','γνοῖς'], '3sg':['γνοίη','γνοῖ'], '1pl':['γνοῖμεν','γνοίημεν'], '2pl':['γνοῖτε','γνοίητε'], '3pl':['γνοῖεν','γνοίησαν'] },
      'aor.act.imper': { '2sg':'γνῶθι', '3sg':'γνώτω', '2pl':'γνῶτε', '3pl':'γνόντων' },
      'aor.act.inf': { inf:'γνῶναι' }
    }
  },

  athaor_haliskomai: {
    kind: 'verb', label: 'Athematic aorist — ἁλίσκομαι', literal: true,
    subtitle: 'ἑάλων — the root aorist of ἁλίσκομαι, "I was captured"',
    example: { lemma:'ἁλίσκομαι', class:'athaor_haliskomai', meaning:'to be captured, be caught' },
    categories: ['aor.act', 'aor.act.subj', 'aor.act.opt', 'aor.act.imper', 'aor.act.inf'],
    cellKeys: ['1sg','2sg','3sg','1pl','2pl','3pl'],
    endings: {
      'aor.act': { '1sg':'ἑάλων', '2sg':'ἑάλως', '3sg':'ἑάλω', '1pl':'ἑάλωμεν', '2pl':'ἑάλωτε', '3pl':'ἑάλωσαν' },
      'aor.act.subj': { '1sg':'ἁλῶ', '2sg':'ἁλῷς', '3sg':'ἁλῷ', '1pl':'ἁλῶμεν', '2pl':'ἁλῶτε', '3pl':'ἁλῶσι(ν)' },
      'aor.act.opt': { '1sg':['ἁλοίην','ἁλοῖμι'], '2sg':['ἁλοίης','ἁλοῖς'], '3sg':['ἁλοίη','ἁλοῖ'], '1pl':['ἁλοῖμεν','ἁλοίημεν'], '2pl':['ἁλοῖτε','ἁλοίητε'], '3pl':['ἁλοῖεν','ἁλοίησαν'] },
      'aor.act.imper': { '2sg':'ἅλωθι', '3sg':'ἁλώτω', '2pl':'ἅλωτε', '3pl':'ἁλόντων' },
      'aor.act.inf': { inf:'ἁλῶναι' }
    }
  },

  /* ====================================================================
     Principal parts, one class per verb (2026-08-30) -- built from
     vocabula's in-progress/greek-principal-parts.json, the same shape as
     the hand-written athematic_eimi/athematic_didomi/... classes above:
     literal:true, one verb per class, every ending value written out
     whole rather than built from a stem+suffix rule, because a principal
     part is by definition the citation form -- often irregular, that's
     the whole reason it has to be memorised rather than derived.

     cellKeys is always just ['1sg']: a principal part IS the first person
     singular of its tense-system, nothing else. categories lists only the
     tense-systems this verb is actually cited with -- a missing category
     here means the form is not in common classical use (Mastronarde's own
     em-dash), never a gap left to fill in later. A value beginning with a
     hyphen in the source dataset (attested only in compounds, e.g. bare
     βαίνω's simple future/aorist/perfect) is dropped from categories
     entirely rather than kept, for the same reason: it is not a real
     answer for the SIMPLE verb this card asks about.

     301 of the dataset's 332 verbs are here. Held back: 13 on Karsten's
     own 2026-08-30 call (2 whose only source redirected elsewhere when
     checked -- σιγάομαι, στρατοπεδεύομαι -- and 11 whose parts were
     derived from a base verb's pattern rather than looked up directly);
     17 that already have a full conjugation drillable elsewhere in this
     deck (λύω, εἰμί, τιμάω and fourteen more -- exactly the fixture the
     parts dataset was built and cross-checked against, which already
     subsumes 'produce the six parts' as a special case of drilling the
     whole paradigm); and 1 genuine homograph (a second, less-standard
     'δέω' clashing in LEMMA, not id, with the kept 'δέω' "bind" -- see
     vocabula/in-progress/GREEK_PARTS_DATASET_NOTES.md for the full
     accounting and every kept verb's provenance). The two verbs whose
     source rows were badly garbled (ἐπιτρέπω, ὄμνυμι) were checked
     against LSJ on 2026-08-30 and their REVIEW flags are closed; each
     carries the finding in its own comment below.

     ALSO 2026-08-30 -- twenty-one futures corrected from the UNCONTRACTED
     to the Attic form. Every one came in verbatim from a `tier=mastronarde`
     row, i.e. one of the 155 verbs read straight off the printed table
     without the per-verb LSJ adjudication the other 150 got, and the table
     prints the uncontracted stem (ἀγγελέω) where Attic writes the contracted
     future (ἀγγελῶ). LSJ marks these explicitly and consistently -- "Ep. and
     Ion. fut. ἀγγελέω ... Att. ἀγγελῶ", "fut. βαλῶ ... Ion. βαλέω", "fut.,
     Ion. καλέω, Att. καλῶ" -- so they were Epic/Ionic forms sitting in a deck
     whose stated register is Attic prose, being asked for and graded as the
     answer. That they were unintended rather than a register choice is
     settled by the deck's own contents: it already held ἀποστελῶ, κτενῶ,
     ἐγκαλῶ and ἀποκρινοῦμαι -- the same stems, contracted -- from the rows
     that DID go through LSJ. Two of the twenty-one were worse than merely
     dialectal: γαμέω and καλέω had a future spelled identically to their own
     present, so those two cards could not be answered distinctly at all.
     Four are not simple contractions and were taken from LSJ individually
     rather than derived: πίνω fut. πίομαι (πιοῦμαι is later), πίπτω
     πεσοῦμαι, τρέχω δραμοῦμαι (root δραμ-), ὄμνυμι ὀμοῦμαι.
     The uncontracted spellings were NOT kept as accepted alternates: for
     γαμέω and καλέω that spelling is the present, so accepting it would undo
     the fix, and for the rest the typo-forgiveness added in 2026.08.30.0
     already absorbs a one-character miss.

     A number of slots were hand-corrected against the raw dataset before
     generation, where the source table's own line-wrapping had scrambled
     a value across the wrong column (a stray 'and', or a form that
     belonged in a neighbouring slot) -- see the generator script's own
     OVERRIDES table for exactly what changed and why, verb by verb.
     ==================================================================== */
  pp_aganakteo: {
    kind: 'verb', label: 'ἀγανακτέω (be annoyed at)', literal: true,
    subtitle: 'ἀγανακτέω, ἀγανακτήσω, ἠγανάκτησα — be annoyed at',
    example: { lemma: 'ἀγανακτέω', class: 'pp_aganakteo', meaning: 'be annoyed at' },
    // Regular -έω (LSJ header lists no forms). Perfect system not in classical use; Med. aor. part. -ησάμενος late (Luc.).
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀγανακτέω' },
      'fut.act': { '1sg': 'ἀγανακτήσω' },
      'aor.act': { '1sg': 'ἠγανάκτησα' }
    },
  },
  pp_aggello: {
    kind: 'verb', label: 'ἀγγέλλω (announce)', literal: true,
    subtitle: 'ἀγγέλλω, ἀγγελῶ, ἤγγειλα, ἤγγελκα, ἤγγελμαι, ἠγγέλθην — announce',
    example: { lemma: 'ἀγγέλλω', class: 'pp_aggello', meaning: 'announce' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀγγέλλω' },
      'fut.act': { '1sg': 'ἀγγελῶ' },
      'aor.act': { '1sg': 'ἤγγειλα' },
      'perf.act': { '1sg': 'ἤγγελκα' },
      'perf.mp': { '1sg': 'ἤγγελμαι' },
      'aor.pass': { '1sg': 'ἠγγέλθην' }
    },
  },
  pp_ageiro: {
    kind: 'verb', label: 'ἀγείρω (collect)', literal: true,
    subtitle: 'ἀγείρω, ἤγειρα — collect',
    example: { lemma: 'ἀγείρω', class: 'pp_ageiro', meaning: 'collect' },
    // LSJ: fut. ἀγερῶ only inscr.; aor. pass. ἠγέρθην Hom.; pf. ἀγήγερμαι App. (post-class.); 'rare in good Prose' — prose prefers συλλέγω. Keep aor. act. only.
    categories: ['pres.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀγείρω' },
      'aor.act': { '1sg': 'ἤγειρα' }
    },
  },
  pp_agnoeo: {
    kind: 'verb', label: 'ἀγνοέω (not to know)', literal: true,
    subtitle: 'ἀγνοέω, ἀγνοήσω, ἠγνόησα, ἠγνόηκα, ἠγνόημαι, ἠγνοήθην — not to know',
    example: { lemma: 'ἀγνοέω', class: 'pp_agnoeo', meaning: 'not to know' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀγνοέω' },
      'fut.act': { '1sg': 'ἀγνοήσω' },
      'aor.act': { '1sg': 'ἠγνόησα' },
      'perf.act': { '1sg': 'ἠγνόηκα' },
      'perf.mp': { '1sg': 'ἠγνόημαι' },
      'aor.pass': { '1sg': 'ἠγνοήθην' }
    },
  },
  pp_agoreuo: {
    kind: 'verb', label: 'ἀγορεύω (say)', literal: true,
    subtitle: 'ἀγορεύω — say',
    example: { lemma: 'ἀγορεύω', class: 'pp_agoreuo', meaning: 'say' },
    // LSJ: the simple verb only pres./impf. in Attic; fut./aor./pf. (-εύσω, -ευσα, -ευκα, -εύθην) Homeric or late, and in Attic found only in compounds. Prose supplies ἐρῶ, εἶπον, εἴρηκα.
    categories: ['pres.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀγορεύω' }
    },
  },
  pp_ago: {
    kind: 'verb', label: 'ἄγω (lead)', literal: true,
    subtitle: 'ἄγω, ἄξω, ἤγαγον, ἦχα, ἦγμαι, ἤχθην — lead',
    example: { lemma: 'ἄγω', class: 'pp_ago', meaning: 'lead' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἄγω' },
      'fut.act': { '1sg': 'ἄξω' },
      'aor.act': { '1sg': 'ἤγαγον' },
      'perf.act': { '1sg': 'ἦχα' },
      'perf.mp': { '1sg': 'ἦγμαι' },
      'aor.pass': { '1sg': 'ἤχθην' }
    },
  },
  pp_agonizomai: {
    kind: 'verb', label: 'ἀγωνίζομαι (contend)', literal: true,
    subtitle: 'ἀγωνίζομαι, ἀγωνιοῦμαι, ἠγωνισάμην, ἠγώνισμαι, ἠγωνίσθην — contend',
    example: { lemma: 'ἀγωνίζομαι', class: 'pp_agonizomai', meaning: 'contend' },
    // Deponent. LSJ: Att. fut. -ιοῦμαι (-ίσομαι only late); pf. ἠγώνισμαι act. sense; aor. ἠγωνίσθην passive sense only.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀγωνίζομαι' },
      'fut.act': { '1sg': 'ἀγωνιοῦμαι' },
      'aor.act': { '1sg': 'ἠγωνισάμην' },
      'perf.mp': { '1sg': 'ἠγώνισμαι' },
      'aor.pass': { '1sg': 'ἠγωνίσθην' }
    },
  },
  pp_adikeo: {
    kind: 'verb', label: 'ἀδικέω ((do) wrong)', literal: true,
    subtitle: 'ἀδικέω, ἀδικήσω, ἠδίκησα, ἠδίκηκα, ἠδίκημαι, ἠδικήθην — (do) wrong',
    example: { lemma: 'ἀδικέω', class: 'pp_adikeo', meaning: '(do) wrong' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀδικέω' },
      'fut.act': { '1sg': 'ἀδικήσω' },
      'aor.act': { '1sg': 'ἠδίκησα' },
      'perf.act': { '1sg': 'ἠδίκηκα' },
      'perf.mp': { '1sg': 'ἠδίκημαι' },
      'aor.pass': { '1sg': 'ἠδικήθην' }
    },
  },
  pp_ado: {
    kind: 'verb', label: 'ᾄδω (sing)', literal: true,
    subtitle: 'ᾄδω, ᾄσομαι, ᾖσα, ᾖσμαι, ᾔσθην — sing',
    example: { lemma: 'ᾄδω', class: 'pp_ado', meaning: 'sing' },
    // Attic contraction of ἀείδω. Middle future ᾄσομαι always in Attic; ᾖσα Ar./Pl.; pass. pf. ᾖσμαι, aor. ᾔσθην.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ᾄδω' },
      'fut.act': { '1sg': 'ᾄσομαι' },
      'aor.act': { '1sg': 'ᾖσα' },
      'perf.mp': { '1sg': 'ᾖσμαι' },
      'aor.pass': { '1sg': 'ᾔσθην' }
    },
  },
  pp_athroizo: {
    kind: 'verb', label: 'ἁθροίζω (collect)', literal: true,
    subtitle: 'ἁθροίζω, ἁθροίσω, ἥθροισα, ἥθροικα, ἥθροισμαι, ἡθροίσθην — collect',
    // Rough breathing throughout, including the aspirated augment (ἥθροισα).
    // The label and lemma used to be smooth (ἀθροίζω) while all six stored
    // forms were rough, so the word was DISPLAYED one way and GRADED another
    // -- and breathings are never stripped by this deck's grader. LSJ heads
    // the entry "ἀθροίζω, Att. ἁθροίζω", so the rough form is the Attic one
    // and the five forms were right; the two display strings were the odd
    // ones out and were brought into line with them (2026-08-30). Flip all
    // eight the other way if the OCR list's own spelling is the smooth one.
    example: { lemma: 'ἁθροίζω', class: 'pp_athroizo', meaning: 'collect' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἁθροίζω' },
      'fut.act': { '1sg': 'ἁθροίσω' },
      'aor.act': { '1sg': 'ἥθροισα' },
      'perf.act': { '1sg': 'ἥθροικα' },
      'perf.mp': { '1sg': 'ἥθροισμαι' },
      'aor.pass': { '1sg': 'ἡθροίσθην' }
    },
  },
  pp_athymeo: {
    kind: 'verb', label: 'ἀθυμέω (be disheartened)', literal: true,
    subtitle: 'ἀθυμέω, ἀθυμήσω, ἠθύμησα — be disheartened',
    example: { lemma: 'ἀθυμέω', class: 'pp_athymeo', meaning: 'be disheartened' },
    // Regular -έω (LSJ header lists no forms); perfect system not in classical use.
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀθυμέω' },
      'fut.act': { '1sg': 'ἀθυμήσω' },
      'aor.act': { '1sg': 'ἠθύμησα' }
    },
  },
  pp_aideomai: {
    kind: 'verb', label: 'αἰδέομαι (reverence)', literal: true,
    subtitle: 'αἰδέομαι, αἰδέσομαι, ᾔδεσμαι, ᾐδέσθην — reverence',
    example: { lemma: 'αἰδέομαι', class: 'pp_aideomai', meaning: 'reverence' },
    // Short-vowel σ-stem: αἰδέσομαι, NOT -ήσομαι. Ordinary aorist is ᾐδέσθην (pass. form, act. sense); ᾐδεσάμην only as law-term 'pardon (a homicide)'.
    categories: ['pres.act', 'fut.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'αἰδέομαι' },
      'fut.act': { '1sg': 'αἰδέσομαι' },
      'perf.mp': { '1sg': 'ᾔδεσμαι' },
      'aor.pass': { '1sg': 'ᾐδέσθην' }
    },
  },
  pp_aineo: {
    kind: 'verb', label: 'αἰνέω (praise)', literal: true,
    subtitle: 'αἰνέω, αἰνέσω, ᾔνεσα, ᾐνέθην — praise',
    example: { lemma: 'αἰνέω', class: 'pp_aineo', meaning: 'praise' },
    // Short-vowel: Att. αἰνέσω/ᾔνεσα (αἰνήσω/ᾔνησα are Ep.). Pf. act./mp. attested in compound ἐπ-. LSJ: poet./Ion., 'very rare in good Att. Prose — ἐπαινέω being used instead'.
    categories: ['pres.act', 'fut.act', 'aor.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'αἰνέω' },
      'fut.act': { '1sg': 'αἰνέσω' },
      'aor.act': { '1sg': 'ᾔνεσα' },
      'aor.pass': { '1sg': 'ᾐνέθην' }
    },
  },
  pp_haireo: {
    kind: 'verb', label: 'αἱρέω (take; mid. choose)', literal: true,
    subtitle: 'αἱρέω, αἱρήσω, εἷλον, ᾕρηκα, ᾕρημαι, ᾑρέθην — take; mid. choose',
    example: { lemma: 'αἱρέω', class: 'pp_haireo', meaning: 'take; mid. choose' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'αἱρέω' },
      'fut.act': { '1sg': 'αἱρήσω' },
      'aor.act': { '1sg': 'εἷλον' },
      'perf.act': { '1sg': 'ᾕρηκα' },
      'perf.mp': { '1sg': 'ᾕρημαι' },
      'aor.pass': { '1sg': 'ᾑρέθην' }
    },
  },
  pp_airo: {
    kind: 'verb', label: 'αἴρω (raise, set out)', literal: true,
    subtitle: 'αἴρω, ἀρῶ, ἦρα, ἦρκα, ἦρμαι, ἤρθην — raise, set out',
    example: { lemma: 'αἴρω', class: 'pp_airo', meaning: 'raise, set out' },
    // Att. for poet. ἀείρω; ᾱ in all aorist moods (ἆραι, ἄρας). Mid. ἠράμην 'won (for oneself)'. Distinguish fut. ἀροῦμαι/aor. ἠρόμην of ἄρνυμαι.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'αἴρω' },
      'fut.act': { '1sg': 'ἀρῶ' },
      'aor.act': { '1sg': 'ἦρα' },
      'perf.act': { '1sg': 'ἦρκα' },
      'perf.mp': { '1sg': 'ἦρμαι' },
      'aor.pass': { '1sg': 'ἤρθην' }
    },
  },
  pp_aisthanomai: {
    kind: 'verb', label: 'αἰσθάνομαι (perceive (+ gen.))', literal: true,
    subtitle: 'αἰσθάνομαι, αἰσθήσομαι, ᾐσθόμην, ᾔσθημαι — perceive (+ gen.)',
    example: { lemma: 'αἰσθάνομαι', class: 'pp_aisthanomai', meaning: 'perceive (+ gen.)' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'αἰσθάνομαι' },
      'fut.act': { '1sg': 'αἰσθήσομαι' },
      'aor.act': { '1sg': 'ᾐσθόμην' },
      'perf.mp': { '1sg': 'ᾔσθημαι' }
    },
  },
  pp_aischynomai: {
    kind: 'verb', label: 'αἰσχύνομαι (be ashamed at)', literal: true,
    subtitle: 'αἰσχύνομαι, αἰσχυνοῦμαι, ᾔσχυμμαι, ᾐσχύνθην — be ashamed at',
    example: { lemma: 'αἰσχύνομαι', class: 'pp_aischynomai', meaning: 'be ashamed at' },
    // 'Feel shame': fut. αἰσχυνοῦμαι (αἰσχυνθήσομαι rare); aorist is ᾐσχύνθην (pass. form). Active αἰσχύνω 'dishonour': fut. αἰσχυνῶ, aor. ᾔσχυνα.
    categories: ['pres.act', 'fut.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'αἰσχύνομαι' },
      'fut.act': { '1sg': 'αἰσχυνοῦμαι' },
      'perf.mp': { '1sg': 'ᾔσχυμμαι' },
      'aor.pass': { '1sg': 'ᾐσχύνθην' }
    },
  },
  pp_aiteo: {
    kind: 'verb', label: 'αἰτέω (ask, beg)', literal: true,
    subtitle: 'αἰτέω, αἰτήσω, ᾔτησα, ᾔτηκα, ᾔτημαι, ᾐτήθην — ask, beg',
    example: { lemma: 'αἰτέω', class: 'pp_aiteo', meaning: 'ask, beg' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'αἰτέω' },
      'fut.act': { '1sg': 'αἰτήσω' },
      'aor.act': { '1sg': 'ᾔτησα' },
      'perf.act': { '1sg': 'ᾔτηκα' },
      'perf.mp': { '1sg': 'ᾔτημαι' },
      'aor.pass': { '1sg': 'ᾐτήθην' }
    },
  },
  pp_aitiaomai: {
    kind: 'verb', label: 'αἰτιάομαι (blame, accuse (+ acc. of person, gen. of thing))', literal: true,
    subtitle: 'αἰτιάομαι, αἰτιάσομαι, ᾐτιασάμην, ᾐτίαμαι, ᾐτιάθην — blame, accuse (+ acc. of person, gen. of thing)',
    example: { lemma: 'αἰτιάομαι', class: 'pp_aitiaomai', meaning: 'blame, accuse (+ acc. of person, gen. of thing)' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'αἰτιάομαι' },
      'fut.act': { '1sg': 'αἰτιάσομαι' },
      'aor.act': { '1sg': 'ᾐτιασάμην' },
      'perf.mp': { '1sg': 'ᾐτίαμαι' },
      'aor.pass': { '1sg': 'ᾐτιάθην' }
    },
  },
  pp_akoloutheo: {
    kind: 'verb', label: 'ἀκολουθέω (follow (+ dat.))', literal: true,
    subtitle: 'ἀκολουθέω, ἀκολουθήσω, ἠκολούθησα — follow (+ dat.)',
    example: { lemma: 'ἀκολουθέω', class: 'pp_akoloutheo', meaning: 'follow (+ dat.)' },
    // Regular -έω (LSJ header lists no forms). Pf. ἠκολούθηκα exists but mainly later; LSJ: replaces ἕπομαι in later Greek.
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀκολουθέω' },
      'fut.act': { '1sg': 'ἀκολουθήσω' },
      'aor.act': { '1sg': 'ἠκολούθησα' }
    },
  },
  pp_akontizo: {
    kind: 'verb', label: 'ἀκοντίζω (hurl javelins (at))', literal: true,
    subtitle: 'ἀκοντίζω, ἀκοντιῶ, ἠκόντισα — hurl javelins (at)',
    example: { lemma: 'ἀκοντίζω', class: 'pp_akontizo', meaning: 'hurl javelins (at)' },
    // LSJ: Att. fut. -ιῶ. Aor. pass. attested in sense 'be hit' but not part of the common paradigm.
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀκοντίζω' },
      'fut.act': { '1sg': 'ἀκοντιῶ' },
      'aor.act': { '1sg': 'ἠκόντισα' }
    },
  },
  pp_akouo: {
    kind: 'verb', label: 'ἀκούω (hear (+ gen. of person))', literal: true,
    subtitle: 'ἀκούω, ἀκούσομαι, ἤκουσα, ἀκήκοα, ἠκούσθην — hear (+ gen. of person)',
    example: { lemma: 'ἀκούω', class: 'pp_akouo', meaning: 'hear (+ gen. of person)' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀκούω' },
      'fut.act': { '1sg': 'ἀκούσομαι' },
      'aor.act': { '1sg': 'ἤκουσα' },
      'perf.act': { '1sg': 'ἀκήκοα' },
      'aor.pass': { '1sg': 'ἠκούσθην' }
    },
  },
  pp_hamartano: {
    kind: 'verb', label: 'ἁμαρτάνω (make a mistake, err)', literal: true,
    subtitle: 'ἁμαρτάνω, ἁμαρτήσομαι, ἥμαρτον, ἡμάρτηκα, ἡμάρτημαι, ἡμαρτήθην — make a mistake, err',
    example: { lemma: 'ἁμαρτάνω', class: 'pp_hamartano', meaning: 'make a mistake, err' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἁμαρτάνω' },
      'fut.act': { '1sg': 'ἁμαρτήσομαι' },
      'aor.act': { '1sg': 'ἥμαρτον' },
      'perf.act': { '1sg': 'ἡμάρτηκα' },
      'perf.mp': { '1sg': 'ἡμάρτημαι' },
      'aor.pass': { '1sg': 'ἡμαρτήθην' }
    },
  },
  pp_amyno: {
    kind: 'verb', label: 'ἀμύνω (ward off; mid. resist)', literal: true,
    subtitle: 'ἀμύνω, ἀμυνῶ, ἤμυνα — ward off; mid. resist',
    example: { lemma: 'ἀμύνω', class: 'pp_amyno', meaning: 'ward off; mid. resist' },
    // No perfect; passive rare. Mid. ἀμύνομαι 'defend oneself / requite': fut. ἀμυνοῦμαι, aor. ἠμυνάμην.
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀμύνω' },
      'fut.act': { '1sg': 'ἀμυνῶ' },
      'aor.act': { '1sg': 'ἤμυνα' }
    },
  },
  pp_anabaino: {
    kind: 'verb', label: 'ἀναβαίνω (board, go on board (ship))', literal: true,
    subtitle: 'ἀναβαίνω, ἀναβήσομαι, ἀνέβην, ἀναβέβηκα, ἀναβέβαμαι, ἀνεβάθην — board, go on board (ship)',
    example: { lemma: 'ἀναβαίνω', class: 'pp_anabaino', meaning: 'board, go on board (ship)' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀναβαίνω' },
      'fut.act': { '1sg': 'ἀναβήσομαι' },
      'aor.act': { '1sg': 'ἀνέβην' },
      'perf.act': { '1sg': 'ἀναβέβηκα' },
      'perf.mp': { '1sg': 'ἀναβέβαμαι' },
      'aor.pass': { '1sg': 'ἀνεβάθην' }
    },
  },
  pp_anagignosko: {
    kind: 'verb', label: 'ἀναγιγνώσκω (read, recognise)', literal: true,
    subtitle: 'ἀναγιγνώσκω, ἀναγνώσομαι, ἀνέγνων, ἀνέγνωκα, ἀνέγνωσμαι, ἀνεγνώσθην — read, recognise',
    example: { lemma: 'ἀναγιγνώσκω', class: 'pp_anagignosko', meaning: 'read, recognise' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀναγιγνώσκω' },
      'fut.act': { '1sg': 'ἀναγνώσομαι' },
      'aor.act': { '1sg': 'ἀνέγνων' },
      'perf.act': { '1sg': 'ἀνέγνωκα' },
      'perf.mp': { '1sg': 'ἀνέγνωσμαι' },
      'aor.pass': { '1sg': 'ἀνεγνώσθην' }
    },
  },
  pp_anagkazo: {
    kind: 'verb', label: 'ἀναγκάζω (compel)', literal: true,
    subtitle: 'ἀναγκάζω, ἀναγκάσω, ἠνάγκασα, ἠνάγκακα, ἠνάγκασμαι, ἠναγκάσθην — compel',
    example: { lemma: 'ἀναγκάζω', class: 'pp_anagkazo', meaning: 'compel' },
    // All six classical: fut. -άσω (E., Th.); pf. ἠνάγκακα (Pl.); fut. pass. ἀναγκασθήσομαι (D.).
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀναγκάζω' },
      'fut.act': { '1sg': 'ἀναγκάσω' },
      'aor.act': { '1sg': 'ἠνάγκασα' },
      'perf.act': { '1sg': 'ἠνάγκακα' },
      'perf.mp': { '1sg': 'ἠνάγκασμαι' },
      'aor.pass': { '1sg': 'ἠναγκάσθην' }
    },
  },
  pp_analisko: {
    kind: 'verb', label: 'ἀναλίσκω (spend)', literal: true,
    subtitle: 'ἀναλίσκω, ἀναλώσω, ἀνήλωσα, ἀνήλωκα, ἀνήλωμαι, ἀνηλώθην — spend',
    example: { lemma: 'ἀναλίσκω', class: 'pp_analisko', meaning: 'spend' },
    // Att. augmented ἀνηλ- forms; ἀναλ- aorist/perfect later or epigraphic. Side-form pres. ἀναλόω. Fut. pass. ἀναλωθήσομαι.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀναλίσκω' },
      'fut.act': { '1sg': 'ἀναλώσω' },
      'aor.act': { '1sg': 'ἀνήλωσα' },
      'perf.act': { '1sg': 'ἀνήλωκα' },
      'perf.mp': { '1sg': 'ἀνήλωμαι' },
      'aor.pass': { '1sg': 'ἀνηλώθην' }
    },
  },
  pp_anasso: {
    kind: 'verb', label: 'ἀνάσσω (rule)', literal: true,
    subtitle: 'ἀνάσσω — rule',
    example: { lemma: 'ἀνάσσω', class: 'pp_anasso', meaning: 'rule' },
    // Epic/poetic verb, mostly present-stem (fut. ἀνάξω Il., aor. ἄναξα Hes. — both poet. only). Prose says ἄρχω/βασιλεύω.
    categories: ['pres.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀνάσσω' }
    },
  },
  pp_anachoreo: {
    kind: 'verb', label: 'ἀναχωρέω (retreat, go back)', literal: true,
    subtitle: 'ἀναχωρέω, ἀναχωρήσω, ἀνεχώρησα, ἀνακεχώρηκα — retreat, go back',
    example: { lemma: 'ἀναχωρέω', class: 'pp_anachoreo', meaning: 'retreat, go back' },
    // Regular -έω compound: internal augment ἀνε-, redup. ἀνακε-. Intransitive, so no classical perf. mp / aor. pass.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀναχωρέω' },
      'fut.act': { '1sg': 'ἀναχωρήσω' },
      'aor.act': { '1sg': 'ἀνεχώρησα' },
      'perf.act': { '1sg': 'ἀνακεχώρηκα' }
    },
  },
  pp_andrapodizo: {
    kind: 'verb', label: 'ἀνδραποδίζω (enslave)', literal: true,
    subtitle: 'ἀνδραποδίζω, ἀνδραποδιῶ, ἠνδραπόδισα, ἠνδραπόδισμαι, ἠνδραποδίσθην — enslave',
    example: { lemma: 'ἀνδραποδίζω', class: 'pp_andrapodizo', meaning: 'enslave' },
    // Att. fut. -ιῶ (X.); Med. also in act. sense; fut. pass. ἀνδραποδισθήσομαι.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀνδραποδίζω' },
      'fut.act': { '1sg': 'ἀνδραποδιῶ' },
      'aor.act': { '1sg': 'ἠνδραπόδισα' },
      'perf.mp': { '1sg': 'ἠνδραπόδισμαι' },
      'aor.pass': { '1sg': 'ἠνδραποδίσθην' }
    },
  },
  pp_anechomai: {
    kind: 'verb', label: 'ἀνέχομαι (endure, hold out)', literal: true,
    subtitle: 'ἀνέχομαι, ἀνέξομαι, ἠνεσχόμην — endure, hold out',
    example: { lemma: 'ἀνέχομαι', class: 'pp_anechomai', meaning: 'endure, hold out' },
    // Double augment: impf. ἠνειχόμην, aor. ἠνεσχόμην (Att.). Also fut. ἀνασχήσομαι. Base ἀνέχω 'hold up': fut. ἀνέξω/ἀνασχήσω, aor. ἀνέσχον.
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀνέχομαι' },
      'fut.act': { '1sg': 'ἀνέξομαι' },
      'aor.act': { '1sg': 'ἠνεσχόμην' }
    },
  },
  pp_aniemi: {
    kind: 'verb', label: 'ἀνίημι (let go, relax)', literal: true,
    subtitle: 'ἀνίημι, ἀνήσω, ἀνῆκα, ἀνεῖκα, ἀνεῖμαι, ἀνείθην — let go, relax',
    example: { lemma: 'ἀνίημι', class: 'pp_aniemi', meaning: 'let go, relax' },
    // Compound of ἵημι, same pattern: aor.1 ἀνῆκα sg. / aor.2 ἀνεῖσαν pl.; pass. pf. ἀνεῖμαι (Hdt., A.), aor. ἀνεθείς (Pl.), fut. ἀνεθήσομαι (Th.).
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀνίημι' },
      'fut.act': { '1sg': 'ἀνήσω' },
      'aor.act': { '1sg': 'ἀνῆκα' },
      'perf.act': { '1sg': 'ἀνεῖκα' },
      'perf.mp': { '1sg': 'ἀνεῖμαι' },
      'aor.pass': { '1sg': 'ἀνείθην' }
    },
  },
  pp_anoignymi: {
    kind: 'verb', label: 'ἀνοίγνυμι (open)', literal: true,
    subtitle: 'ἀνοίγνυμι, ἀνοίξω, ἀνέῳξα, ἀνέῳχα, ἀνέῳγμαι, ἀνεῴχθην — open',
    example: { lemma: 'ἀνοίγνυμι', class: 'pp_anoignymi', meaning: 'open' },
    // Double/triple augment ἀνέῳ- (impf. ἀνέῳγον). Side-pres. ἀνοίγω; ἤνοιξα X. and late; intr. pf.2 ἀνέῳγα 'stand open' not Attic (only Din.).
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀνοίγνυμι' },
      'fut.act': { '1sg': 'ἀνοίξω' },
      'aor.act': { '1sg': 'ἀνέῳξα' },
      'perf.act': { '1sg': 'ἀνέῳχα' },
      'perf.mp': { '1sg': 'ἀνέῳγμαι' },
      'aor.pass': { '1sg': 'ἀνεῴχθην' }
    },
  },
  pp_axioo: {
    kind: 'verb', label: 'ἀξιόω (deem worthy)', literal: true,
    subtitle: 'ἀξιόω, ἀξιώσω, ἠξίωσα, ἠξίωκα, ἠξίωμαι, ἠξιώθην — deem worthy',
    example: { lemma: 'ἀξιόω', class: 'pp_axioo', meaning: 'deem worthy' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀξιόω' },
      'fut.act': { '1sg': 'ἀξιώσω' },
      'aor.act': { '1sg': 'ἠξίωσα' },
      'perf.act': { '1sg': 'ἠξίωκα' },
      'perf.mp': { '1sg': 'ἠξίωμαι' },
      'aor.pass': { '1sg': 'ἠξιώθην' }
    },
  },
  pp_apallatto: {
    kind: 'verb', label: 'ἀπαλλάττω (set free, escape)', literal: true,
    subtitle: 'ἀπαλλάττω, ἀπαλλάξω, ἀπήλλαξα, ἀπήλλαχα, ἀπήλλαγμαι, ἀπηλλάγην — set free, escape',
    example: { lemma: 'ἀπαλλάττω', class: 'pp_apallatto', meaning: 'set free, escape' },
    // Aor. pass.: Attic prefers 2nd ἀπηλλάγην; 1st ἀπηλλάχθην also classical (Hdt., trag.). Fut. pass. ἀπαλλαχθήσομαι E., ἀπαλλαγήσομαι also Attic.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀπαλλάττω' },
      'fut.act': { '1sg': 'ἀπαλλάξω' },
      'aor.act': { '1sg': 'ἀπήλλαξα' },
      'perf.act': { '1sg': 'ἀπήλλαχα' },
      'perf.mp': { '1sg': 'ἀπήλλαγμαι' },
      'aor.pass': { '1sg': 'ἀπηλλάγην' }
    },
  },
  pp_apantao: {
    kind: 'verb', label: 'ἀπαντάω (meet (+ dat.))', literal: true,
    subtitle: 'ἀπαντάω, ἀπαντήσομαι, ἀπήντησα, ἀπήντηκα — meet (+ dat.)',
    example: { lemma: 'ἀπαντάω', class: 'pp_apantao', meaning: 'meet (+ dat.)' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀπαντάω' },
      'fut.act': { '1sg': 'ἀπαντήσομαι' },
      'aor.act': { '1sg': 'ἀπήντησα' },
      'perf.act': { '1sg': 'ἀπήντηκα' }
    },
  },
  pp_apechthanomai: {
    kind: 'verb', label: 'ἀπεχθάνομαι (be hated)', literal: true,
    subtitle: 'ἀπεχθάνομαι, ἀπεχθήσομαι, ἀπηχθόμην, ἀπήχθημαι — be hated',
    example: { lemma: 'ἀπεχθάνομαι', class: 'pp_apechthanomai', meaning: 'be hated' },
    // Deponent 'incur hatred': aor.2 mid. ἀπηχθόμην (inf. ἀπεχθέσθαι); pf. ἀπήχθημαι (Th., X.). No aor. pass.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀπεχθάνομαι' },
      'fut.act': { '1sg': 'ἀπεχθήσομαι' },
      'aor.act': { '1sg': 'ἀπηχθόμην' },
      'perf.mp': { '1sg': 'ἀπήχθημαι' }
    },
  },
  pp_apecho: {
    kind: 'verb', label: 'ἀπέχω (be distant)', literal: true,
    subtitle: 'ἀπέχω, ἀφέξω, ἀπέσχον — be distant',
    example: { lemma: 'ἀπέχω', class: 'pp_apecho', meaning: 'be distant' },
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀπέχω' },
      'fut.act': { '1sg': ['ἀφέξω', 'ἀποσχήσω'] },
      'aor.act': { '1sg': 'ἀπέσχον' }
    },
  },
  pp_apodidomai: {
    kind: 'verb', label: 'ἀποδίδομαι (sell)', literal: true,
    subtitle: 'ἀποδίδομαι, ἀποδώσομαι, ἀπεδόμην, πέπρακα, πέπραμαι, ἐπράθην — sell',
    example: { lemma: 'ἀποδίδομαι', class: 'pp_apodidomai', meaning: 'sell' },
    // 'Sell' is a suppletive set: pres. πωλῶ/ἀποδίδομαι, fut. ἀποδώσομαι, aor. ἀπεδόμην, perfect system and aor. pass. from πιπράσκω (πέπρακα, πέπραμαι, ἐπράθην). Active ἀποδίδωμι 'give back' follows δίδωμι.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀποδίδομαι' },
      'fut.act': { '1sg': 'ἀποδώσομαι' },
      'aor.act': { '1sg': 'ἀπεδόμην' },
      'perf.act': { '1sg': 'πέπρακα' },
      'perf.mp': { '1sg': 'πέπραμαι' },
      'aor.pass': { '1sg': 'ἐπράθην' }
    },
  },
  pp_apothnesko: {
    kind: 'verb', label: 'ἀποθνῄσκω (die, be killed)', literal: true,
    subtitle: 'ἀποθνῄσκω, ἀποθανοῦμαι, ἀπέθανον, τέθνηκα — die, be killed',
    example: { lemma: 'ἀποθνῄσκω', class: 'pp_apothnesko', meaning: 'die, be killed' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀποθνῄσκω' },
      'fut.act': { '1sg': 'ἀποθανοῦμαι' },
      'aor.act': { '1sg': 'ἀπέθανον' },
      'perf.act': { '1sg': 'τέθνηκα' }
    },
  },
  pp_apokrinomai: {
    kind: 'verb', label: 'ἀποκρίνομαι (reply)', literal: true,
    subtitle: 'ἀποκρίνομαι, ἀποκρινοῦμαι, ἀπεκρινάμην, ἀποκέκριμαι — reply',
    example: { lemma: 'ἀποκρίνομαι', class: 'pp_apokrinomai', meaning: 'reply' },
    // 'Answer', deponent. Pf. ἀποκέκριμαι in middle sense (Pl.). ἀπεκρίθην = 'was separated' in Attic; 'answered' only in later Greek (NT).
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀποκρίνομαι' },
      'fut.act': { '1sg': 'ἀποκρινοῦμαι' },
      'aor.act': { '1sg': 'ἀπεκρινάμην' },
      'perf.mp': { '1sg': 'ἀποκέκριμαι' }
    },
  },
  pp_apokteino: {
    kind: 'verb', label: 'ἀποκτείνω (kill)', literal: true,
    subtitle: 'ἀποκτείνω, ἀποκτενῶ, ἀπέκτεινα, ἀπέκτονα — kill',
    example: { lemma: 'ἀποκτείνω', class: 'pp_apokteino', meaning: 'kill' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀποκτείνω' },
      'fut.act': { '1sg': 'ἀποκτενῶ' },
      'aor.act': { '1sg': 'ἀπέκτεινα' },
      'perf.act': { '1sg': 'ἀπέκτονα' }
    },
  },
  pp_apologeomai: {
    kind: 'verb', label: 'ἀπολογέομαι (defend oneself)', literal: true,
    subtitle: 'ἀπολογέομαι, ἀπολογήσομαι, ἀπελογησάμην, ἀπολελόγημαι — defend oneself',
    example: { lemma: 'ἀπολογέομαι', class: 'pp_apologeomai', meaning: 'defend oneself' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀπολογέομαι' },
      'fut.act': { '1sg': 'ἀπολογήσομαι' },
      'aor.act': { '1sg': 'ἀπελογησάμην' },
      'perf.mp': { '1sg': 'ἀπολελόγημαι' }
    },
  },
  pp_aporeo: {
    kind: 'verb', label: 'ἀπορέω (be at a loss)', literal: true,
    subtitle: 'ἀπορέω, ἀπορήσω, ἠπόρησα, ἠπόρηκα, ἠπόρημαι, ἠπορήθην — be at a loss',
    example: { lemma: 'ἀπορέω', class: 'pp_aporeo', meaning: 'be at a loss' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀπορέω' },
      'fut.act': { '1sg': 'ἀπορήσω' },
      'aor.act': { '1sg': 'ἠπόρησα' },
      'perf.act': { '1sg': 'ἠπόρηκα' },
      'perf.mp': { '1sg': 'ἠπόρημαι' },
      'aor.pass': { '1sg': 'ἠπορήθην' }
    },
  },
  pp_apostello: {
    kind: 'verb', label: 'ἀποστέλλω (send away)', literal: true,
    subtitle: 'ἀποστέλλω, ἀποστελῶ, ἀπέστειλα, ἀπέσταλκα, ἀπέσταλμαι, ἀπεστάλην — send away',
    example: { lemma: 'ἀποστέλλω', class: 'pp_apostello', meaning: 'send away' },
    // στέλλω pattern: liquid fut. -στελῶ; aor.2 pass. ἀπεστάλην (ἀποσταλείς E., Hdt.).
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀποστέλλω' },
      'fut.act': { '1sg': 'ἀποστελῶ' },
      'aor.act': { '1sg': 'ἀπέστειλα' },
      'perf.act': { '1sg': 'ἀπέσταλκα' },
      'perf.mp': { '1sg': 'ἀπέσταλμαι' },
      'aor.pass': { '1sg': 'ἀπεστάλην' }
    },
  },
  pp_apostereo: {
    kind: 'verb', label: 'ἀποστερέω (deprive (+ acc. of person, gen. of thing))', literal: true,
    subtitle: 'ἀποστερέω, ἀποστερήσω, ἀπεστέρησα, ἀπεστέρηκα, ἀπεστέρημαι, ἀπεστερήθην — deprive (+ acc. of person, gen. of thing)',
    example: { lemma: 'ἀποστερέω', class: 'pp_apostereo', meaning: 'deprive (+ acc. of person, gen. of thing)' },
    // Regular -έω. Fut. pass. both ἀποστερήσομαι (E., Th., D.) and ἀποστερηθήσομαι (Lys.).
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀποστερέω' },
      'fut.act': { '1sg': 'ἀποστερήσω' },
      'aor.act': { '1sg': 'ἀπεστέρησα' },
      'perf.act': { '1sg': 'ἀπεστέρηκα' },
      'perf.mp': { '1sg': 'ἀπεστέρημαι' },
      'aor.pass': { '1sg': 'ἀπεστερήθην' }
    },
  },
  pp_haptomai: {
    kind: 'verb', label: 'ἅπτομαι (lay hold of, touch (+ gen.))', literal: true,
    subtitle: 'ἅπτομαι, ἅψομαι, ἡψάμην, ἧμμαι — lay hold of, touch (+ gen.)',
    example: { lemma: 'ἅπτομαι', class: 'pp_haptomai', meaning: 'lay hold of, touch (+ gen.)' },
    // 'Touch' (mid.): pf. ἧμμαι shared with pass. Active ἅπτω 'kindle, fasten': ἅψω, ἧψα. Aor. pass. ἥφθην marginal classically.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἅπτομαι' },
      'fut.act': { '1sg': 'ἅψομαι' },
      'aor.act': { '1sg': 'ἡψάμην' },
      'perf.mp': { '1sg': 'ἧμμαι' }
    },
  },
  pp_aresko: {
    kind: 'verb', label: 'ἀρέσκω (please (+ dat.))', literal: true,
    subtitle: 'ἀρέσκω, ἀρέσω, ἤρεσα — please (+ dat.)',
    example: { lemma: 'ἀρέσκω', class: 'pp_aresko', meaning: 'please (+ dat.)' },
    // Short-vowel σ-stem: ἀρέσω/ἤρεσα (NOT -ήσω). Pf. ἀρήρεκα late only (Corn., S.E.); aor. pass. ἠρέσθην late (med. sense once in S.).
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀρέσκω' },
      'fut.act': { '1sg': 'ἀρέσω' },
      'aor.act': { '1sg': 'ἤρεσα' }
    },
  },
  pp_arkeo: {
    kind: 'verb', label: 'ἀρκέω (suffice)', literal: true,
    subtitle: 'ἀρκέω, ἀρκέσω, ἤρκεσα — suffice',
    example: { lemma: 'ἀρκέω', class: 'pp_arkeo', meaning: 'suffice' },
    // Short-vowel σ-stem: ἀρκέσω/ἤρκεσα. No classical perfect; pass. forms late.
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀρκέω' },
      'fut.act': { '1sg': 'ἀρκέσω' },
      'aor.act': { '1sg': 'ἤρκεσα' }
    },
  },
  pp_harpazo: {
    kind: 'verb', label: 'ἁρπάζω (seize)', literal: true,
    subtitle: 'ἁρπάζω, ἁρπάσομαι, ἥρπασα, ἥρπακα, ἥρπασμαι, ἡρπάσθην — seize',
    example: { lemma: 'ἁρπάζω', class: 'pp_harpazo', meaning: 'seize' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἁρπάζω' },
      'fut.act': { '1sg': 'ἁρπάσομαι' },
      'aor.act': { '1sg': 'ἥρπασα' },
      'perf.act': { '1sg': 'ἥρπακα' },
      'perf.mp': { '1sg': 'ἥρπασμαι' },
      'aor.pass': { '1sg': 'ἡρπάσθην' }
    },
  },
  pp_archo: {
    kind: 'verb', label: 'ἄρχω (rule; mid. begin (+ gen.))', literal: true,
    subtitle: 'ἄρχω, ἄρξω, ἦρξα, ἦρχα, ἦργμαι, ἤρχθην — rule; mid. begin (+ gen.)',
    example: { lemma: 'ἄρχω', class: 'pp_archo', meaning: 'rule; mid. begin (+ gen.)' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἄρχω' },
      'fut.act': { '1sg': 'ἄρξω' },
      'aor.act': { '1sg': 'ἦρξα' },
      'perf.act': { '1sg': 'ἦρχα' },
      'perf.mp': { '1sg': 'ἦργμαι' },
      'aor.pass': { '1sg': 'ἤρχθην' }
    },
  },
  pp_askeo: {
    kind: 'verb', label: 'ἀσκέω (adorn, exercise)', literal: true,
    subtitle: 'ἀσκέω, ἀσκήσω, ἤσκησα, ἤσκηκα, ἤσκημαι — adorn, exercise',
    example: { lemma: 'ἀσκέω', class: 'pp_askeo', meaning: 'adorn, exercise' },
    // Regular -έω; pf. act. ἠσκήκαμεν D. 3.28, pf. pass. ἤσκημαι common. Aor. pass. not in common classical use.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀσκέω' },
      'fut.act': { '1sg': 'ἀσκήσω' },
      'aor.act': { '1sg': 'ἤσκησα' },
      'perf.act': { '1sg': 'ἤσκηκα' },
      'perf.mp': { '1sg': 'ἤσκημαι' }
    },
  },
  pp_aulizomai: {
    kind: 'verb', label: 'αὐλίζομαι (encamp)', literal: true,
    subtitle: 'αὐλίζομαι, ηὐλισάμην, ηὐλίσθην — encamp',
    example: { lemma: 'αὐλίζομαι', class: 'pp_aulizomai', meaning: 'encamp' },
    // 'Encamp', deponent. Thucydides always uses aor. mid. ηὐλισάμην, Xenophon always aor. pass. ηὐλίσθην — both classical. Pf. ηὔλισμαι post-classical; no classical future.
    categories: ['pres.act', 'aor.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'αὐλίζομαι' },
      'aor.act': { '1sg': 'ηὐλισάμην' },
      'aor.pass': { '1sg': 'ηὐλίσθην' }
    },
  },
  pp_auxano: {
    kind: 'verb', label: 'αὐξάνω (increase)', literal: true,
    subtitle: 'αὐξάνω, αὐξήσω, ηὔξησα, ηὔξηκα, ηὔξημαι, ηὐξήθην — increase',
    example: { lemma: 'αὐξάνω', class: 'pp_auxano', meaning: 'increase' },
    // Side-form αὔξω equally classical. Fut. pass. αὐξηθήσομαι (D.) and αὐξήσομαι (X., Pl.).
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'αὐξάνω' },
      'fut.act': { '1sg': 'αὐξήσω' },
      'aor.act': { '1sg': 'ηὔξησα' },
      'perf.act': { '1sg': 'ηὔξηκα' },
      'perf.mp': { '1sg': 'ηὔξημαι' },
      'aor.pass': { '1sg': 'ηὐξήθην' }
    },
  },
  pp_aphiemi: {
    kind: 'verb', label: 'ἀφίημι (let go)', literal: true,
    subtitle: 'ἀφίημι, ἀφήσω, ἀφῆκα, ἀφεῖκα, ἀφεῖμαι, ἀφείθην — let go',
    example: { lemma: 'ἀφίημι', class: 'pp_aphiemi', meaning: 'let go' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀφίημι' },
      'fut.act': { '1sg': 'ἀφήσω' },
      'aor.act': { '1sg': 'ἀφῆκα' },
      'perf.act': { '1sg': 'ἀφεῖκα' },
      'perf.mp': { '1sg': 'ἀφεῖμαι' },
      'aor.pass': { '1sg': 'ἀφείθην' }
    },
  },
  pp_aphikneomai: {
    kind: 'verb', label: 'ἀφικνέομαι (arrive)', literal: true,
    subtitle: 'ἀφικνέομαι, ἀφίξομαι, ἀφικόμην, ἀφῖγμαι — arrive',
    example: { lemma: 'ἀφικνέομαι', class: 'pp_aphikneomai', meaning: 'arrive' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀφικνέομαι' },
      'fut.act': { '1sg': 'ἀφίξομαι' },
      'aor.act': { '1sg': 'ἀφικόμην' },
      'perf.mp': { '1sg': 'ἀφῖγμαι' }
    },
  },
  pp_aphistamai: {
    kind: 'verb', label: 'ἀφίσταμαι (revolt)', literal: true,
    subtitle: 'ἀφίσταμαι, ἀποστήσομαι, ἀπέστην, ἀφέστηκα — revolt',
    example: { lemma: 'ἀφίσταμαι', class: 'pp_aphistamai', meaning: 'revolt' },
    // 'Revolt / stand aloof', intransitive system of ἀφίστημι: aor.2 ἀπέστην, pf. ἀφέστηκα with present sense (syncop. pl. ἀφέσταμεν). Trans. 'make revolt': ἀποστήσω, ἀπέστησα. Aor. pass. ἀπεστάθην poet./rare.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἀφίσταμαι' },
      'fut.act': { '1sg': 'ἀποστήσομαι' },
      'aor.act': { '1sg': 'ἀπέστην' },
      'perf.act': { '1sg': 'ἀφέστηκα' }
    },
  },
  pp_ballo: {
    kind: 'verb', label: 'βάλλω (throw)', literal: true,
    subtitle: 'βάλλω, βαλῶ, ἔβαλον, βέβληκα, βέβλημαι, ἐβλήθην — throw',
    example: { lemma: 'βάλλω', class: 'pp_ballo', meaning: 'throw' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'βάλλω' },
      'fut.act': { '1sg': 'βαλῶ' },
      'aor.act': { '1sg': 'ἔβαλον' },
      'perf.act': { '1sg': 'βέβληκα' },
      'perf.mp': { '1sg': 'βέβλημαι' },
      'aor.pass': { '1sg': 'ἐβλήθην' }
    },
  },
  pp_biazo: {
    kind: 'verb', label: 'βιάζω (compel)', literal: true,
    subtitle: 'βιάζω, βιάσομαι, ἐβιασάμην, βεβίασμαι, ἐβιάσθην — compel',
    example: { lemma: 'βιάζω', class: 'pp_biazo', meaning: 'compel' },
    // In practice mid. βιάζομαι 'use force, compel'; act. rare. ἐβιάσθην = 'was forced' (Th., D.); pf. βεβίασμαι both mid. (D.) and pass. (X.) sense.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'βιάζω' },
      'fut.act': { '1sg': 'βιάσομαι' },
      'aor.act': { '1sg': 'ἐβιασάμην' },
      'perf.mp': { '1sg': 'βεβίασμαι' },
      'aor.pass': { '1sg': 'ἐβιάσθην' }
    },
  },
  pp_blapto: {
    kind: 'verb', label: 'βλάπτω (harm, injure)', literal: true,
    subtitle: 'βλάπτω, βλάψω, ἔβλαψα, βέβλαφα, βέβλαμμαι, ἐβλάβην — harm, injure',
    example: { lemma: 'βλάπτω', class: 'pp_blapto', meaning: 'harm, injure' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'βλάπτω' },
      'fut.act': { '1sg': 'βλάψω' },
      'aor.act': { '1sg': 'ἔβλαψα' },
      'perf.act': { '1sg': 'βέβλαφα' },
      'perf.mp': { '1sg': 'βέβλαμμαι' },
      'aor.pass': { '1sg': ['ἐβλάβην', 'ἐβλάφθην'] }
    },
  },
  pp_blepo: {
    kind: 'verb', label: 'βλέπω (see)', literal: true,
    subtitle: 'βλέπω, βλέψομαι, ἔβλεψα — see',
    example: { lemma: 'βλέπω', class: 'pp_blepo', meaning: 'see' },
    // Attic future is middle βλέψομαι (D.); βλέψω only late. Chiefly pres./aor. in classical authors; no classical perfect (βέβλεφα late, in compound).
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'βλέπω' },
      'fut.act': { '1sg': 'βλέψομαι' },
      'aor.act': { '1sg': 'ἔβλεψα' }
    },
  },
  pp_boetheo: {
    kind: 'verb', label: 'βοηθέω (help (+ dat.))', literal: true,
    subtitle: 'βοηθέω, βοηθήσω, ἐβοήθησα, βεβοήθηκα, βεβοήθημαι — help (+ dat.)',
    example: { lemma: 'βοηθέω', class: 'pp_boetheo', meaning: 'help (+ dat.)' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'βοηθέω' },
      'fut.act': { '1sg': 'βοηθήσω' },
      'aor.act': { '1sg': 'ἐβοήθησα' },
      'perf.act': { '1sg': 'βεβοήθηκα' },
      'perf.mp': { '1sg': 'βεβοήθημαι' }
    },
  },
  pp_bouleuo: {
    kind: 'verb', label: 'βουλεύω (take counsel)', literal: true,
    subtitle: 'βουλεύω, βουλεύσω, ἐβούλευσα, βεβούλευκα, βεβούλευμαι, ἐβουλεύθην — take counsel',
    example: { lemma: 'βουλεύω', class: 'pp_bouleuo', meaning: 'take counsel' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'βουλεύω' },
      'fut.act': { '1sg': 'βουλεύσω' },
      'aor.act': { '1sg': 'ἐβούλευσα' },
      'perf.act': { '1sg': 'βεβούλευκα' },
      'perf.mp': { '1sg': 'βεβούλευμαι' },
      'aor.pass': { '1sg': 'ἐβουλεύθην' }
    },
  },
  pp_boulomai: {
    kind: 'verb', label: 'βούλομαι (wish, want)', literal: true,
    subtitle: 'βούλομαι, βουλήσομαι, βεβούλημαι, ἐβουλήθην — wish, want',
    example: { lemma: 'βούλομαι', class: 'pp_boulomai', meaning: 'wish, want' },
    categories: ['pres.act', 'fut.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'βούλομαι' },
      'fut.act': { '1sg': 'βουλήσομαι' },
      'perf.mp': { '1sg': 'βεβούλημαι' },
      'aor.pass': { '1sg': 'ἐβουλήθην' }
    },
  },
  pp_gameo: {
    kind: 'verb', label: 'γαμέω (marry)', literal: true,
    subtitle: 'γαμέω, γαμῶ, ἔγημα, γεγάμηκα, γεγάμημαι — marry',
    example: { lemma: 'γαμέω', class: 'pp_gameo', meaning: 'marry' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'γαμέω' },
      'fut.act': { '1sg': 'γαμῶ' },
      'aor.act': { '1sg': 'ἔγημα' },
      'perf.act': { '1sg': 'γεγάμηκα' },
      'perf.mp': { '1sg': 'γεγάμημαι' }
    },
  },
  pp_gelao: {
    kind: 'verb', label: 'γελάω (laugh)', literal: true,
    subtitle: 'γελάω, γελάσομαι, ἐγέλασα, ἐγελάσθην — laugh',
    example: { lemma: 'γελάω', class: 'pp_gelao', meaning: 'laugh' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'γελάω' },
      'fut.act': { '1sg': 'γελάσομαι' },
      'aor.act': { '1sg': 'ἐγέλασα' },
      'aor.pass': { '1sg': 'ἐγελάσθην' }
    },
  },
  pp_gignomai: {
    kind: 'verb', label: 'γίγνομαι (become, happen)', literal: true,
    subtitle: 'γίγνομαι, γενήσομαι, ἐγενόμην, γέγονα, γεγένημαι, ἐγενήθην — become, happen',
    example: { lemma: 'γίγνομαι', class: 'pp_gignomai', meaning: 'become, happen' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'γίγνομαι' },
      'fut.act': { '1sg': 'γενήσομαι' },
      'aor.act': { '1sg': 'ἐγενόμην' },
      'perf.act': { '1sg': 'γέγονα' },
      'perf.mp': { '1sg': 'γεγένημαι' },
      'aor.pass': { '1sg': 'ἐγενήθην' }
    },
  },
  pp_grapho: {
    kind: 'verb', label: 'γράφω (write)', literal: true,
    subtitle: 'γράφω, γράψω, ἔγραψα, γέγραφα, γέγραμμαι, ἐγράφην — write',
    example: { lemma: 'γράφω', class: 'pp_grapho', meaning: 'write' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'γράφω' },
      'fut.act': { '1sg': 'γράψω' },
      'aor.act': { '1sg': 'ἔγραψα' },
      'perf.act': { '1sg': 'γέγραφα' },
      'perf.mp': { '1sg': 'γέγραμμαι' },
      'aor.pass': { '1sg': 'ἐγράφην' }
    },
  },
  pp_dakryo: {
    kind: 'verb', label: 'δακρύω (cry)', literal: true,
    subtitle: 'δακρύω, δακρύσω, ἐδάκρυσα, δεδάκρυμαι — cry',
    example: { lemma: 'δακρύω', class: 'pp_dakryo', meaning: 'cry' },
    // Pf. pass. δεδάκρυμαι 'be in tears' (Hom. onwards) is the living perfect; act. δεδάκρυκα late.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'δακρύω' },
      'fut.act': { '1sg': 'δακρύσω' },
      'aor.act': { '1sg': 'ἐδάκρυσα' },
      'perf.mp': { '1sg': 'δεδάκρυμαι' }
    },
  },
  pp_dei: {
    kind: 'verb', label: 'δεῖ (it is necessary)', literal: true,
    subtitle: 'δεῖ, δεήσει, ἐδέησε — it is necessary',
    example: { lemma: 'δεῖ', class: 'pp_dei', meaning: 'it is necessary' },
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'δεῖ' },
      'fut.act': { '1sg': 'δεήσει' },
      'aor.act': { '1sg': 'ἐδέησε' }
    },
  },
  pp_dechomai: {
    kind: 'verb', label: 'δέχομαι (receive)', literal: true,
    subtitle: 'δέχομαι, δέξομαι, ἐδεξάμην, δέδεγμαι — receive',
    example: { lemma: 'δέχομαι', class: 'pp_dechomai', meaning: 'receive' },
    // Deponent. Aor. pass. ἐδέχθην only late or in compounds; Ep. athematic forms (ἐδέγμην, δέκτο) poetic.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'δέχομαι' },
      'fut.act': { '1sg': 'δέξομαι' },
      'aor.act': { '1sg': 'ἐδεξάμην' },
      'perf.mp': { '1sg': 'δέδεγμαι' }
    },
  },
  pp_deobind: {
    kind: 'verb', label: 'δέω (bind)', literal: true,
    subtitle: 'δέω, δεήσω, ἐδέησα, δεδέηκα, δεδέημαι, ἐδεήθην — bind',
    example: { lemma: 'δέω', class: 'pp_deobind', meaning: 'bind' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'δέω' },
      'fut.act': { '1sg': 'δεήσω' },
      'aor.act': { '1sg': 'ἐδέησα' },
      'perf.act': { '1sg': 'δεδέηκα' },
      'perf.mp': { '1sg': 'δεδέημαι' },
      'aor.pass': { '1sg': 'ἐδεήθην' }
    },
  },
  pp_diaphtheiro: {
    kind: 'verb', label: 'διαφθείρω (destroy)', literal: true,
    subtitle: 'διαφθείρω, διαφθερῶ, διέφθειρα, διέφθαρκα, διέφθαρμαι, διεφθάρην — destroy',
    example: { lemma: 'διαφθείρω', class: 'pp_diaphtheiro', meaning: 'destroy' },
    // A second, intransitive-sense perfect διέφθορα ('am ruined') is also cited, alongside this transitive perf.act -- same shape as ἀπόλλυμι/ἀπόλωλα.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'διαφθείρω' },
      'fut.act': { '1sg': 'διαφθερῶ' },
      'aor.act': { '1sg': 'διέφθειρα' },
      'perf.act': { '1sg': 'διέφθαρκα' },
      'perf.mp': { '1sg': 'διέφθαρμαι' },
      'aor.pass': { '1sg': 'διεφθάρην' }
    },
  },
  pp_didasko: {
    kind: 'verb', label: 'διδάσκω (teach)', literal: true,
    subtitle: 'διδάσκω, διδάξω, ἐδίδαξα, δεδίδαχα, δεδίδαγμαι, ἐδιδάχθην — teach',
    example: { lemma: 'διδάσκω', class: 'pp_didasko', meaning: 'teach' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'διδάσκω' },
      'fut.act': { '1sg': 'διδάξω' },
      'aor.act': { '1sg': 'ἐδίδαξα' },
      'perf.act': { '1sg': 'δεδίδαχα' },
      'perf.mp': { '1sg': 'δεδίδαγμαι' },
      'aor.pass': { '1sg': 'ἐδιδάχθην' }
    },
  },
  pp_dioko: {
    kind: 'verb', label: 'διώκω (pursue)', literal: true,
    subtitle: 'διώκω, διώξομαι, ἐδίωξα, δεδίωχα, ἐδιώχθην — pursue',
    example: { lemma: 'διώκω', class: 'pp_dioko', meaning: 'pursue' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'διώκω' },
      'fut.act': { '1sg': ['διώξομαι', 'διώξω'] },
      'aor.act': { '1sg': 'ἐδίωξα' },
      'perf.act': { '1sg': 'δεδίωχα' },
      'aor.pass': { '1sg': 'ἐδιώχθην' }
    },
  },
  pp_dokeo: {
    kind: 'verb', label: 'δοκέω (think; impers. it seems good (+ dat.))', literal: true,
    subtitle: 'δοκέω, δόξω, ἔδοξα, δέδογμαι — think; impers. it seems good (+ dat.)',
    example: { lemma: 'δοκέω', class: 'pp_dokeo', meaning: 'think; impers. it seems good (+ dat.)' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'δοκέω' },
      'fut.act': { '1sg': 'δόξω' },
      'aor.act': { '1sg': 'ἔδοξα' },
      'perf.mp': { '1sg': 'δέδογμαι' }
    },
  },
  pp_drao: {
    kind: 'verb', label: 'δράω (do)', literal: true,
    subtitle: 'δράω, δράσω, ἔδρασα, δέδρακα, δέδραμαι, ἐδράσθην — do',
    example: { lemma: 'δράω', class: 'pp_drao', meaning: 'do' },
    // ᾱ-stem contract: -ᾱσ- forms (ρ precedes). All six classical; aor. pass. ἐδράσθην in Th.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'δράω' },
      'fut.act': { '1sg': 'δράσω' },
      'aor.act': { '1sg': 'ἔδρασα' },
      'perf.act': { '1sg': 'δέδρακα' },
      'perf.mp': { '1sg': 'δέδραμαι' },
      'aor.pass': { '1sg': 'ἐδράσθην' }
    },
  },
  pp_dynamai: {
    kind: 'verb', label: 'δύναμαι (be able)', literal: true,
    subtitle: 'δύναμαι, δυνήσομαι, δεδύνημαι, ἐδυνήθην — be able',
    example: { lemma: 'δύναμαι', class: 'pp_dynamai', meaning: 'be able' },
    categories: ['pres.act', 'fut.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'δύναμαι' },
      'fut.act': { '1sg': 'δυνήσομαι' },
      'perf.mp': { '1sg': 'δεδύνημαι' },
      'aor.pass': { '1sg': 'ἐδυνήθην' }
    },
  },
  pp_eao: {
    kind: 'verb', label: 'ἐάω (allow)', literal: true,
    subtitle: 'ἐάω, ἐάσω, εἴασα, εἴακα, εἴαμαι, εἰάθην — allow',
    example: { lemma: 'ἐάω', class: 'pp_eao', meaning: 'allow' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἐάω' },
      'fut.act': { '1sg': 'ἐάσω' },
      'aor.act': { '1sg': 'εἴασα' },
      'perf.act': { '1sg': 'εἴακα' },
      'perf.mp': { '1sg': 'εἴαμαι' },
      'aor.pass': { '1sg': 'εἰάθην' }
    },
  },
  pp_egeiro: {
    kind: 'verb', label: 'ἐγείρω (rouse, stir up)', literal: true,
    subtitle: 'ἐγείρω, ἐγερῶ, ἤγειρα, ἐγρήγορα, ἠγέρθην — rouse, stir up',
    example: { lemma: 'ἐγείρω', class: 'pp_egeiro', meaning: 'rouse, stir up' },
    // Pf. slot: intr. ἐγρήγορα 'am awake' (present sense; Ar., Pl.) — the perfect worth knowing; trans. ἐγήγερκα late; pf. pass. ἐγήγερμαι only v.l. Th. Poet. aor. mid. ἠγρόμην 'woke up'.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἐγείρω' },
      'fut.act': { '1sg': 'ἐγερῶ' },
      'aor.act': { '1sg': 'ἤγειρα' },
      'perf.act': { '1sg': 'ἐγρήγορα' },
      'aor.pass': { '1sg': 'ἠγέρθην' }
    },
  },
  pp_egkaleo: {
    kind: 'verb', label: 'ἐγκαλέω (accuse (+ dat.))', literal: true,
    subtitle: 'ἐγκαλέω, ἐγκαλῶ, ἐνεκάλεσα, ἐγκέκληκα, ἐγκέκλημαι, ἐνεκλήθην — accuse (+ dat.)',
    example: { lemma: 'ἐγκαλέω', class: 'pp_egkaleo', meaning: 'accuse (+ dat.)' },
    // Compound of καλέω: Attic contract future ἐγκαλῶ (spelt like the present); internal augment ἐνε-; pf. pass. τὰ ἐγκεκλημένα 'charges'.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἐγκαλέω' },
      'fut.act': { '1sg': 'ἐγκαλῶ' },
      'aor.act': { '1sg': 'ἐνεκάλεσα' },
      'perf.act': { '1sg': 'ἐγκέκληκα' },
      'perf.mp': { '1sg': 'ἐγκέκλημαι' },
      'aor.pass': { '1sg': 'ἐνεκλήθην' }
    },
  },
  pp_ethelo: {
    kind: 'verb', label: 'ἐθέλω (wish, want)', literal: true,
    subtitle: 'ἐθέλω, ἐθελήσω, ἠθέλησα, ἠθέληκα — wish, want',
    example: { lemma: 'ἐθέλω', class: 'pp_ethelo', meaning: 'wish, want' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἐθέλω' },
      'fut.act': { '1sg': 'ἐθελήσω' },
      'aor.act': { '1sg': 'ἠθέλησα' },
      'perf.act': { '1sg': 'ἠθέληκα' }
    },
  },
  pp_eiko: {
    kind: 'verb', label: 'εἴκω (yield)', literal: true,
    subtitle: 'εἴκω, εἴξω, εἶξα — yield',
    example: { lemma: 'εἴκω', class: 'pp_eiko', meaning: 'yield' },
    // 'Yield': intransitive, no passive system; no classical perfect.
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'εἴκω' },
      'fut.act': { '1sg': 'εἴξω' },
      'aor.act': { '1sg': 'εἶξα' }
    },
  },
  pp_eirgo: {
    kind: 'verb', label: 'εἴργω (prevent, hinder, shut out)', literal: true,
    subtitle: 'εἴργω, εἴρξω, εἶρξα, εἶργμαι, εἴρχθην — prevent, hinder, shut out',
    example: { lemma: 'εἴργω', class: 'pp_eirgo', meaning: 'prevent, hinder, shut out' },
    // Smooth breathing 'shut out', rough εἵργω 'shut in' (Attic distinction per Eustathius; both spellings in codd.). No perfect active. Fut. mid. εἴρξομαι in pass. sense (X.).
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'εἴργω' },
      'fut.act': { '1sg': 'εἴρξω' },
      'aor.act': { '1sg': 'εἶρξα' },
      'perf.mp': { '1sg': 'εἶργμαι' },
      'aor.pass': { '1sg': 'εἴρχθην' }
    },
  },
  pp_ekpletto: {
    kind: 'verb', label: 'ἐκπλήττω (strike with panic)', literal: true,
    subtitle: 'ἐκπλήττω, ἐκπλήξω, ἐξέπληξα, ἐκπέπληγμαι, ἐξεπλάγην — strike with panic',
    example: { lemma: 'ἐκπλήττω', class: 'pp_ekpletto', meaning: 'strike with panic' },
    // The living forms are passive: aor.2 pass. ἐξεπλάγην 'was astounded' (not -ήχθην), pf. ἐκπέπληγμαι. LSJ lemmatizes ἐκπλήσσω.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἐκπλήττω' },
      'fut.act': { '1sg': 'ἐκπλήξω' },
      'aor.act': { '1sg': 'ἐξέπληξα' },
      'perf.mp': { '1sg': 'ἐκπέπληγμαι' },
      'aor.pass': { '1sg': 'ἐξεπλάγην' }
    },
  },
  pp_elauno: {
    kind: 'verb', label: 'ἐλαύνω (drive)', literal: true,
    subtitle: 'ἐλαύνω, ἐλάω, ἤλασα, ἐλήλαμαι, ἠλάθην — drive',
    example: { lemma: 'ἐλαύνω', class: 'pp_elauno', meaning: 'drive' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἐλαύνω' },
      'fut.act': { '1sg': 'ἐλάω' },
      'aor.act': { '1sg': 'ἤλασα' },
      'perf.mp': { '1sg': 'ἐλήλαμαι' },
      'aor.pass': { '1sg': 'ἠλάθην' }
    },
  },
  pp_elegcho: {
    kind: 'verb', label: 'ἐλέγχω (examine, refute)', literal: true,
    subtitle: 'ἐλέγχω, ἐλέγξω, ἤλεγξα, ἐλήλεγμαι, ἠλέγχθην — examine, refute',
    example: { lemma: 'ἐλέγχω', class: 'pp_elegcho', meaning: 'examine, refute' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἐλέγχω' },
      'fut.act': { '1sg': 'ἐλέγξω' },
      'aor.act': { '1sg': 'ἤλεγξα' },
      'perf.mp': { '1sg': 'ἐλήλεγμαι' },
      'aor.pass': { '1sg': 'ἠλέγχθην' }
    },
  },
  pp_elpizo: {
    kind: 'verb', label: 'ἐλπίζω (hope)', literal: true,
    subtitle: 'ἐλπίζω, ἐλπιῶ, ἤλπισα, ἠλπίσθην — hope',
    example: { lemma: 'ἐλπίζω', class: 'pp_elpizo', meaning: 'hope' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἐλπίζω' },
      'fut.act': { '1sg': 'ἐλπιῶ' },
      'aor.act': { '1sg': 'ἤλπισα' },
      'aor.pass': { '1sg': 'ἠλπίσθην' }
    },
  },
  pp_exapatao: {
    kind: 'verb', label: 'ἐξαπατάω (deceive)', literal: true,
    subtitle: 'ἐξαπατάω, ἐξαπατήσω, ἐξηπάτησα, ἐξηπάτηκα, ἐξηπάτημαι, ἐξηπατήθην — deceive',
    example: { lemma: 'ἐξαπατάω', class: 'pp_exapatao', meaning: 'deceive' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἐξαπατάω' },
      'fut.act': { '1sg': 'ἐξαπατήσω' },
      'aor.act': { '1sg': 'ἐξηπάτησα' },
      'perf.act': { '1sg': 'ἐξηπάτηκα' },
      'perf.mp': { '1sg': 'ἐξηπάτημαι' },
      'aor.pass': { '1sg': 'ἐξηπατήθην' }
    },
  },
  pp_exetazo: {
    kind: 'verb', label: 'ἐξετάζω (examine, review (an army))', literal: true,
    subtitle: 'ἐξετάζω, ἐξετάσω, ἐξήτασα, ἐξήτακα, ἐξήτασμαι, ἐξητάσθην — examine, review (an army)',
    example: { lemma: 'ἐξετάζω', class: 'pp_exetazo', meaning: 'examine, review (an army)' },
    // All six classical; fut. ἐξετάσω (rarely Attic contract ἐξετῶ, Isoc.); fut. pass. ἐξετασθήσομαι D.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἐξετάζω' },
      'fut.act': { '1sg': 'ἐξετάσω' },
      'aor.act': { '1sg': 'ἐξήτασα' },
      'perf.act': { '1sg': 'ἐξήτακα' },
      'perf.mp': { '1sg': 'ἐξήτασμαι' },
      'aor.pass': { '1sg': 'ἐξητάσθην' }
    },
  },
  pp_epaineo: {
    kind: 'verb', label: 'ἐπαινέω (praise)', literal: true,
    subtitle: 'ἐπαινέω, ἐπαινέσομαι, ἐπῄνεσα, ἐπῄνεκα, ἐπῄνημαι, ἐπῃνέθην — praise',
    example: { lemma: 'ἐπαινέω', class: 'pp_epaineo', meaning: 'praise' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἐπαινέω' },
      'fut.act': { '1sg': ['ἐπαινέσομαι', 'ἐπαινέσω'] },
      'aor.act': { '1sg': 'ἐπῄνεσα' },
      'perf.act': { '1sg': 'ἐπῄνεκα' },
      'perf.mp': { '1sg': 'ἐπῄνημαι' },
      'aor.pass': { '1sg': 'ἐπῃνέθην' }
    },
  },
  pp_epanerchomai: {
    kind: 'verb', label: 'ἐπανέρχομαι (return)', literal: true,
    subtitle: 'ἐπανέρχομαι, ἐπάνειμι, ἐπανῆλθον, ἐπανελήλυθα — return',
    example: { lemma: 'ἐπανέρχομαι', class: 'pp_epanerchomai', meaning: 'return' },
    // Compound of ἔρχομαι: in Attic the future is supplied by ἐπάνειμι (εἶμι), not -ελεύσομαι.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἐπανέρχομαι' },
      'fut.act': { '1sg': 'ἐπάνειμι' },
      'aor.act': { '1sg': 'ἐπανῆλθον' },
      'perf.act': { '1sg': 'ἐπανελήλυθα' }
    },
  },
  pp_epeigo: {
    kind: 'verb', label: 'ἐπείγω (urge on, hasten)', literal: true,
    subtitle: 'ἐπείγω, ἐπείξομαι, ἠπείχθην — urge on, hasten',
    example: { lemma: 'ἐπείγω', class: 'pp_epeigo', meaning: 'urge on, hasten' },
    // Living classical usage: pres./impf. act. and mid. ἐπείγομαι 'hurry'; 'hurried' = aor. pass. ἠπείχθην (Th., Pl.). Act. aor. ἤπειξα post-classical. κατεπείγω commoner in Attic prose.
    categories: ['pres.act', 'fut.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἐπείγω' },
      'fut.act': { '1sg': 'ἐπείξομαι' },
      'aor.pass': { '1sg': 'ἠπείχθην' }
    },
  },
  pp_epithymeo: {
    kind: 'verb', label: 'ἐπιθυμέω (desire (+ gen.))', literal: true,
    subtitle: 'ἐπιθυμέω, ἐπιθυμήσω, ἐπεθύμησα, ἐπιτεθύμηκα — desire (+ gen.)',
    example: { lemma: 'ἐπιθυμέω', class: 'pp_epithymeo', meaning: 'desire (+ gen.)' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἐπιθυμέω' },
      'fut.act': { '1sg': 'ἐπιθυμήσω' },
      'aor.act': { '1sg': 'ἐπεθύμησα' },
      'perf.act': { '1sg': 'ἐπιτεθύμηκα' }
    },
  },
  pp_epilanthanomai: {
    kind: 'verb', label: 'ἐπιλανθάνομαι (forget (+ gen.))', literal: true,
    subtitle: 'ἐπιλανθάνομαι, ἐπιλήσομαι, ἐπελαθόμην, ἐπιλέλησμαι — forget (+ gen.)',
    example: { lemma: 'ἐπιλανθάνομαι', class: 'pp_epilanthanomai', meaning: 'forget (+ gen.)' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἐπιλανθάνομαι' },
      'fut.act': { '1sg': 'ἐπιλήσομαι' },
      'aor.act': { '1sg': 'ἐπελαθόμην' },
      'perf.mp': { '1sg': 'ἐπιλέλησμαι' }
    },
  },
  pp_epistamai: {
    kind: 'verb', label: 'ἐπίσταμαι (understand)', literal: true,
    subtitle: 'ἐπίσταμαι, ἐπιστήσομαι, ἠπιστήθην — understand',
    example: { lemma: 'ἐπίσταμαι', class: 'pp_epistamai', meaning: 'understand' },
    categories: ['pres.act', 'fut.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἐπίσταμαι' },
      'fut.act': { '1sg': 'ἐπιστήσομαι' },
      'aor.pass': { '1sg': 'ἠπιστήθην' }
    },
  },
  pp_epitrepo: {
    kind: 'verb', label: 'ἐπιτρέπω (entrust)', literal: true,
    subtitle: 'ἐπιτρέπω, ἐπιτρέψω, ἐπέτρεψα, ἐπιτέτραφα, ἐπιτέτραμμαι, ἐπετράπην — entrust',
    example: { lemma: 'ἐπιτρέπω', class: 'pp_epitrepo', meaning: 'entrust' },
    // LSJ-checked 2026-08-30, review closed. The source row was garbled (a
    // parenthesis spanning two mis-split slots) and the reconstruction had
    // picked ἐπιτέτροφα for the perfect. LSJ s.v. ἐπιτρέπω gives exactly one
    // perfect active -- "pf. -τέτρα^φα (Plb. 30.6.6)" -- and ἐπιτέτροφα does
    // not appear in the entry at all, so the perfect is ἐπιτέτραφα here.
    // (τέτροφα IS a perfect of the simplex τρέπω, which is presumably how the
    // reconstruction reached for it; it is not attested for this compound.)
    // Kept rather than emptied even though Polybius is post-classical, because
    // Mastronarde prints a perfect for this verb; drop the slot if the
    // Attic-prose-only rule is ever applied strictly. The other two slots are
    // confirmed: perf.mp ἐπιτέτραμμαι (Th. 1.126 ἐπιτετραμμένοι) and aor. pass.
    // ἐπετράπην ("aor. 2 -ετράπην, Th. 5.31"), both squarely Attic prose;
    // ἐπετρέφθην is LSJ's aor. 1 passive (Antipho) and is deliberately not
    // listed as an alternate.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἐπιτρέπω' },
      'fut.act': { '1sg': 'ἐπιτρέψω' },
      'aor.act': { '1sg': 'ἐπέτρεψα' },
      'perf.act': { '1sg': 'ἐπιτέτραφα' },
      'perf.mp': { '1sg': 'ἐπιτέτραμμαι' },
      'aor.pass': { '1sg': 'ἐπετράπην' }
    },
  },
  pp_hepomai: {
    kind: 'verb', label: 'ἕπομαι (follow)', literal: true,
    subtitle: 'ἕπομαι, ἕψομαι, ἑσπόμην — follow',
    example: { lemma: 'ἕπομαι', class: 'pp_hepomai', meaning: 'follow' },
    // Impf. εἱπόμην; aor.2 moods without the augment vowel (σπέσθαι, σπόμενος, imper. σποῦ). No perfect. LSJ: replaced by ἀκολουθέω in later Greek.
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἕπομαι' },
      'fut.act': { '1sg': 'ἕψομαι' },
      'aor.act': { '1sg': 'ἑσπόμην' }
    },
  },
  pp_ergazomai: {
    kind: 'verb', label: 'ἐργάζομαι (work)', literal: true,
    subtitle: 'ἐργάζομαι, ἐργάσομαι, ἠργασάμην, εἴργασμαι, ἠργάσθην — work',
    example: { lemma: 'ἐργάζομαι', class: 'pp_ergazomai', meaning: 'work' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἐργάζομαι' },
      'fut.act': { '1sg': 'ἐργάσομαι' },
      'aor.act': { '1sg': 'ἠργασάμην' },
      'perf.mp': { '1sg': 'εἴργασμαι' },
      'aor.pass': { '1sg': 'ἠργάσθην' }
    },
  },
  pp_erchomai: {
    kind: 'verb', label: 'ἔρχομαι (come, go)', literal: true,
    subtitle: 'ἔρχομαι, ἐλεύσομαι, ἦλθον, ἐλήλυθα — come, go',
    example: { lemma: 'ἔρχομαι', class: 'pp_erchomai', meaning: 'come, go' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἔρχομαι' },
      'fut.act': { '1sg': 'ἐλεύσομαι' },
      'aor.act': { '1sg': 'ἦλθον' },
      'perf.act': { '1sg': 'ἐλήλυθα' }
    },
  },
  pp_esthio: {
    kind: 'verb', label: 'ἐσθίω (eat)', literal: true,
    subtitle: 'ἐσθίω, ἔδομαι, ἔφαγον, ἐδήδοκα, ἠδέσθην — eat',
    example: { lemma: 'ἐσθίω', class: 'pp_esthio', meaning: 'eat' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἐσθίω' },
      'fut.act': { '1sg': 'ἔδομαι' },
      'aor.act': { '1sg': 'ἔφαγον' },
      'perf.act': { '1sg': 'ἐδήδοκα' },
      'aor.pass': { '1sg': 'ἠδέσθην' }
    },
  },
  pp_heurisko: {
    kind: 'verb', label: 'εὑρίσκω (find, invent)', literal: true,
    subtitle: 'εὑρίσκω, εὑρήσω, ηὗρον, ηὕρηκα, ηὕρημαι, ηὑρέθην — find, invent',
    example: { lemma: 'εὑρίσκω', class: 'pp_heurisko', meaning: 'find, invent' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'εὑρίσκω' },
      'fut.act': { '1sg': 'εὑρήσω' },
      'aor.act': { '1sg': 'ηὗρον' },
      'perf.act': { '1sg': 'ηὕρηκα' },
      'perf.mp': { '1sg': 'ηὕρημαι' },
      'aor.pass': { '1sg': 'ηὑρέθην' }
    },
  },
  pp_euchomai: {
    kind: 'verb', label: 'εὔχομαι (pray)', literal: true,
    subtitle: 'εὔχομαι, εὔξομαι, ηὐξάμην, ηὖγμαι — pray',
    example: { lemma: 'εὔχομαι', class: 'pp_euchomai', meaning: 'pray' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'εὔχομαι' },
      'fut.act': { '1sg': 'εὔξομαι' },
      'aor.act': { '1sg': 'ηὐξάμην' },
      'perf.mp': { '1sg': 'ηὖγμαι' }
    },
  },
  pp_echo: {
    kind: 'verb', label: 'ἔχω (have)', literal: true,
    subtitle: 'ἔχω, ἕξω, ἔσχον, ἔσχηκα, ἐσχέθην — have',
    example: { lemma: 'ἔχω', class: 'pp_echo', meaning: 'have' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἔχω' },
      'fut.act': { '1sg': ['ἕξω', 'σχήσω'] },
      'aor.act': { '1sg': 'ἔσχον' },
      'perf.act': { '1sg': 'ἔσχηκα' },
      'aor.pass': { '1sg': 'ἐσχέθην' }
    },
  },
  pp_zao: {
    kind: 'verb', label: 'ζάω (live)', literal: true,
    subtitle: 'ζῶ, ζήσω, ἔζησα — live',
    example: { lemma: 'ζάω', class: 'pp_zao', meaning: 'live' },
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ζῶ' },
      'fut.act': { '1sg': 'ζήσω' },
      'aor.act': { '1sg': 'ἔζησα' }
    },
  },
  pp_zeugnymi: {
    kind: 'verb', label: 'ζεύγνυμι (yoke)', literal: true,
    subtitle: 'ζεύγνυμι, ζεύξω, ἔζευξα, ἔζευγμαι, ἐζύγην — yoke',
    example: { lemma: 'ζεύγνυμι', class: 'pp_zeugnymi', meaning: 'yoke' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ζεύγνυμι' },
      'fut.act': { '1sg': 'ζεύξω' },
      'aor.act': { '1sg': 'ἔζευξα' },
      'perf.mp': { '1sg': 'ἔζευγμαι' },
      'aor.pass': { '1sg': ['ἐζύγην', 'ἐζεύχθην'] }
    },
  },
  pp_zeloo: {
    kind: 'verb', label: 'ζηλόω (envy)', literal: true,
    subtitle: 'ζηλόω, ζηλώσω, ἐζήλωσα, ἐζήλωκα, ἐζήλωμαι, ἐζηλώθην — envy',
    example: { lemma: 'ζηλόω', class: 'pp_zeloo', meaning: 'envy' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ζηλόω' },
      'fut.act': { '1sg': 'ζηλώσω' },
      'aor.act': { '1sg': 'ἐζήλωσα' },
      'perf.act': { '1sg': 'ἐζήλωκα' },
      'perf.mp': { '1sg': 'ἐζήλωμαι' },
      'aor.pass': { '1sg': 'ἐζηλώθην' }
    },
  },
  pp_zeteo: {
    kind: 'verb', label: 'ζητέω (seek)', literal: true,
    subtitle: 'ζητέω, ζητήσω, ἐζήτησα, ἐζήτηκα, ἐζήτημαι, ἐζητήθην — seek',
    example: { lemma: 'ζητέω', class: 'pp_zeteo', meaning: 'seek' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ζητέω' },
      'fut.act': { '1sg': 'ζητήσω' },
      'aor.act': { '1sg': 'ἐζήτησα' },
      'perf.act': { '1sg': 'ἐζήτηκα' },
      'perf.mp': { '1sg': 'ἐζήτημαι' },
      'aor.pass': { '1sg': 'ἐζητήθην' }
    },
  },
  pp_hegeomai: {
    kind: 'verb', label: 'ἡγέομαι (lead (+ dat.), consider)', literal: true,
    subtitle: 'ἡγέομαι, ἡγήσομαι, ἡγησάμην, ἥγημαι — lead (+ dat.), consider',
    example: { lemma: 'ἡγέομαι', class: 'pp_hegeomai', meaning: 'lead (+ dat.), consider' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἡγέομαι' },
      'fut.act': { '1sg': 'ἡγήσομαι' },
      'aor.act': { '1sg': 'ἡγησάμην' },
      'perf.mp': { '1sg': 'ἥγημαι' }
    },
  },
  pp_hedomai: {
    kind: 'verb', label: 'ἥδομαι (enjoy, take pleasure, rejoice)', literal: true,
    subtitle: 'ἥδομαι, ἡσθήσομαι, ἥσθην — enjoy, take pleasure, rejoice',
    example: { lemma: 'ἥδομαι', class: 'pp_hedomai', meaning: 'enjoy, take pleasure, rejoice' },
    categories: ['pres.act', 'fut.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἥδομαι' },
      'fut.act': { '1sg': 'ἡσθήσομαι' },
      'aor.pass': { '1sg': 'ἥσθην' }
    },
  },
  pp_heko: {
    kind: 'verb', label: 'ἥκω (have come)', literal: true,
    subtitle: 'ἥκω, ἥξω — have come',
    example: { lemma: 'ἥκω', class: 'pp_heko', meaning: 'have come' },
    categories: ['pres.act', 'fut.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἥκω' },
      'fut.act': { '1sg': 'ἥξω' }
    },
  },
  pp_hesychazo: {
    kind: 'verb', label: 'ἡσυχάζω (be quiet)', literal: true,
    subtitle: 'ἡσυχάζω, ἡσυχάσω, ἡσύχασα — be quiet',
    example: { lemma: 'ἡσυχάζω', class: 'pp_hesychazo', meaning: 'be quiet' },
    // Intransitive; fut. -άσω (Th.; -άσομαι Luc.); augment invisible on η-.
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἡσυχάζω' },
      'fut.act': { '1sg': 'ἡσυχάσω' },
      'aor.act': { '1sg': 'ἡσύχασα' }
    },
  },
  pp_hettaomai: {
    kind: 'verb', label: 'ἡττάομαι (be defeated)', literal: true,
    subtitle: 'ἡττάομαι, ἡττήσομαι, ἥττημαι, ἡττήθην — be defeated',
    example: { lemma: 'ἡττάομαι', class: 'pp_hettaomai', meaning: 'be defeated' },
    categories: ['pres.act', 'fut.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἡττάομαι' },
      'fut.act': { '1sg': 'ἡττήσομαι' },
      'perf.mp': { '1sg': 'ἥττημαι' },
      'aor.pass': { '1sg': 'ἡττήθην' }
    },
  },
  pp_thapto: {
    kind: 'verb', label: 'θάπτω (bury)', literal: true,
    subtitle: 'θάπτω, θάψω, ἔθαψα, τέθαμμαι, ἐτάφην — bury',
    example: { lemma: 'θάπτω', class: 'pp_thapto', meaning: 'bury' },
    // No perfect active. Aor.2 pass. ἐτάφην always in Attic (ἐθάφθην Ion./rare); fut. pass. ταφήσομαι and τεθάψομαι. Grassmann pair θ-/τ- in τέθαμμαι/ἐτάφην.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'θάπτω' },
      'fut.act': { '1sg': 'θάψω' },
      'aor.act': { '1sg': 'ἔθαψα' },
      'perf.mp': { '1sg': 'τέθαμμαι' },
      'aor.pass': { '1sg': 'ἐτάφην' }
    },
  },
  pp_tharseo: {
    kind: 'verb', label: 'θαρσέω (be encouraged)', literal: true,
    subtitle: 'θαρσέω, θαρσήσω, ἐθάρσησα, τεθάρσηκα — be encouraged',
    example: { lemma: 'θαρσέω', class: 'pp_tharseo', meaning: 'be encouraged' },
    // Attic spells θαρρέω (θαρρήσω, ἐθάρρησα, τεθάρρηκα) — same -ρσ-/-ρρ- pair as the deck's -ττ-/-σσ- words. Pf. τεθάρσηκα already in Homer, τεθαρρηκώς Plu.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'θαρσέω' },
      'fut.act': { '1sg': 'θαρσήσω' },
      'aor.act': { '1sg': 'ἐθάρσησα' },
      'perf.act': { '1sg': 'τεθάρσηκα' }
    },
  },
  pp_thaumazo: {
    kind: 'verb', label: 'θαυμάζω (wonder (at))', literal: true,
    subtitle: 'θαυμάζω, θαυμάσομαι, ἐθαύμασα, τεθαύμακα, τεθαύμασμαι, ἐθαυμάσθην — wonder (at)',
    example: { lemma: 'θαυμάζω', class: 'pp_thaumazo', meaning: 'wonder (at)' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'θαυμάζω' },
      'fut.act': { '1sg': 'θαυμάσομαι' },
      'aor.act': { '1sg': 'ἐθαύμασα' },
      'perf.act': { '1sg': 'τεθαύμακα' },
      'perf.mp': { '1sg': 'τεθαύμασμαι' },
      'aor.pass': { '1sg': 'ἐθαυμάσθην' }
    },
  },
  pp_theaomai: {
    kind: 'verb', label: 'θεάομαι (look at)', literal: true,
    subtitle: 'θεάομαι, θεάσομαι, ἐθεασάμην, τεθέαμαι — look at',
    example: { lemma: 'θεάομαι', class: 'pp_theaomai', meaning: 'look at' },
    // Deponent; -ᾱ- kept after ε (θεάσομαι, not -ήσομαι). Pf. τεθέαμαι X. Aor. pass. ἐθεάθην late only.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'θεάομαι' },
      'fut.act': { '1sg': 'θεάσομαι' },
      'aor.act': { '1sg': 'ἐθεασάμην' },
      'perf.mp': { '1sg': 'τεθέαμαι' }
    },
  },
  pp_therapeuo: {
    kind: 'verb', label: 'θεραπεύω (attend (as servant))', literal: true,
    subtitle: 'θεραπεύω, θεραπεύσω, ἐθεράπευσα, τεθεράπευμαι, ἐθεραπεύθην — attend (as servant)',
    example: { lemma: 'θεραπεύω', class: 'pp_therapeuo', meaning: 'attend (as servant)' },
    // Regular -εύω; fut. mid. θεραπεύσομαι in passive sense (Antipho, Pl.). Pf. act. τεθεράπευκα not securely classical.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'θεραπεύω' },
      'fut.act': { '1sg': 'θεραπεύσω' },
      'aor.act': { '1sg': 'ἐθεράπευσα' },
      'perf.mp': { '1sg': 'τεθεράπευμαι' },
      'aor.pass': { '1sg': 'ἐθεραπεύθην' }
    },
  },
  pp_theoreo: {
    kind: 'verb', label: 'θεωρέω (look at)', literal: true,
    subtitle: 'θεωρέω, θεωρήσω, ἐθεώρησα, τεθεώρηκα, τεθεώρημαι — look at',
    example: { lemma: 'θεωρέω', class: 'pp_theoreo', meaning: 'look at' },
    // Regular -έω; pf. τεθεώρηκα Ar. V. 1188; pf. pass. τεθεώρηται Arist. Aor. pass. classical evidence thin (fut. -ηθήσομαι only S.E.).
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'θεωρέω' },
      'fut.act': { '1sg': 'θεωρήσω' },
      'aor.act': { '1sg': 'ἐθεώρησα' },
      'perf.act': { '1sg': 'τεθεώρηκα' },
      'perf.mp': { '1sg': 'τεθεώρημαι' }
    },
  },
  pp_therao: {
    kind: 'verb', label: 'θηράω (hunt)', literal: true,
    subtitle: 'θηράω, θηράσομαι, ἐθήρασα, τεθήρακα, ἐθηράθην — hunt',
    example: { lemma: 'θηράω', class: 'pp_therao', meaning: 'hunt' },
    // -ᾱ- after ρ throughout (θηράσω/ἐθήρασα). Moeris: the true Attic future is middle θηράσομαι. Aor. pass. ἐθηράθην A., E., X.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'θηράω' },
      'fut.act': { '1sg': 'θηράσομαι' },
      'aor.act': { '1sg': 'ἐθήρασα' },
      'perf.act': { '1sg': 'τεθήρακα' },
      'aor.pass': { '1sg': 'ἐθηράθην' }
    },
  },
  pp_thereuo: {
    kind: 'verb', label: 'θηρεύω (hunt)', literal: true,
    subtitle: 'θηρεύω, θηρεύσω, ἐθήρευσα, τεθήρευκα, τεθήρευμαι, ἐθηρεύθην — hunt',
    example: { lemma: 'θηρεύω', class: 'pp_thereuo', meaning: 'hunt' },
    // All attested (pf. act. and aor. pass. in Plato/Hdt.). Tragedy prefers θηράω where metre allows.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'θηρεύω' },
      'fut.act': { '1sg': 'θηρεύσω' },
      'aor.act': { '1sg': 'ἐθήρευσα' },
      'perf.act': { '1sg': 'τεθήρευκα' },
      'perf.mp': { '1sg': 'τεθήρευμαι' },
      'aor.pass': { '1sg': 'ἐθηρεύθην' }
    },
  },
  pp_threneo: {
    kind: 'verb', label: 'θρηνέω (lament, mourn)', literal: true,
    subtitle: 'θρηνέω, θρηνήσω, ἐθρήνησα — lament, mourn',
    example: { lemma: 'θρηνέω', class: 'pp_threneo', meaning: 'lament, mourn' },
    // Regular -έω; pf. pass. only impersonal (ἅλις τεθρήνηται S. Ph. 1401).
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'θρηνέω' },
      'fut.act': { '1sg': 'θρηνήσω' },
      'aor.act': { '1sg': 'ἐθρήνησα' }
    },
  },
  pp_thyo: {
    kind: 'verb', label: 'θύω (sacrifice)', literal: true,
    subtitle: 'θύω, θύσω, ἔθυσα, τέθυκα, τέθυμαι, ἐτύθην — sacrifice',
    example: { lemma: 'θύω', class: 'pp_thyo', meaning: 'sacrifice' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'θύω' },
      'fut.act': { '1sg': 'θύσω' },
      'aor.act': { '1sg': 'ἔθυσα' },
      'perf.act': { '1sg': 'τέθυκα' },
      'perf.mp': { '1sg': 'τέθυμαι' },
      'aor.pass': { '1sg': 'ἐτύθην' }
    },
  },
  pp_hiketeuo: {
    kind: 'verb', label: 'ἱκετεύω (beseech)', literal: true,
    subtitle: 'ἱκετεύω, ἱκετεύσω, ἱκέτευσα — beseech',
    example: { lemma: 'ἱκετεύω', class: 'pp_hiketeuo', meaning: 'beseech' },
    // Regular -εύω; the augment lengthens ἱ- (ῑ) without changing the spelling.
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ἱκετεύω' },
      'fut.act': { '1sg': 'ἱκετεύσω' },
      'aor.act': { '1sg': 'ἱκέτευσα' }
    },
  },
  pp_kathairo: {
    kind: 'verb', label: 'καθαίρω (cleanse, purify)', literal: true,
    subtitle: 'καθαίρω, καθαρῶ, ἐκάθηρα, κεκάθαρμαι, ἐκαθάρθην — cleanse, purify',
    example: { lemma: 'καθαίρω', class: 'pp_kathairo', meaning: 'cleanse, purify' },
    // Liquid stem: fut. καθαρῶ, Attic aor. ἐκάθηρα (ἐκάθᾱρα later); not a κατα- compound — augments at the front. Pf. pass. κεκάθαρμαι Pl. Phd.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'καθαίρω' },
      'fut.act': { '1sg': 'καθαρῶ' },
      'aor.act': { '1sg': 'ἐκάθηρα' },
      'perf.mp': { '1sg': 'κεκάθαρμαι' },
      'aor.pass': { '1sg': 'ἐκαθάρθην' }
    },
  },
  pp_kathezomai: {
    kind: 'verb', label: 'καθέζομαι (sit)', literal: true,
    subtitle: 'καθέζομαι, καθεδοῦμαι — sit',
    example: { lemma: 'καθέζομαι', class: 'pp_kathezomai', meaning: 'sit' },
    // Fut. καθεδοῦμαι (Ar., Pl., D.). No classical aorist of its own: the impf. ἐκαθεζόμην does aorist duty, or Attic uses ἐκαθισάμην/ἐκάθισα from καθίζω. καθεσθείς late.
    categories: ['pres.act', 'fut.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'καθέζομαι' },
      'fut.act': { '1sg': 'καθεδοῦμαι' }
    },
  },
  pp_katheudo: {
    kind: 'verb', label: 'καθεύδω (sleep)', literal: true,
    subtitle: 'καθεύδω, καθευδήσω — sleep',
    example: { lemma: 'καθεύδω', class: 'pp_katheudo', meaning: 'sleep' },
    // No Attic aorist (ἐκαθεύδησα only Luc.): 'slept' is the imperfect — ἐκάθευδον or καθηῦδον, both Attic. Fut. καθευδήσω Ar., X.
    categories: ['pres.act', 'fut.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'καθεύδω' },
      'fut.act': { '1sg': 'καθευδήσω' }
    },
  },
  pp_kathemai: {
    kind: 'verb', label: 'κάθημαι (sit)', literal: true,
    subtitle: 'κάθημαι — sit',
    example: { lemma: 'κάθημαι', class: 'pp_kathemai', meaning: 'sit' },
    // Athematic present-only verb ('sit', perfect-shaped like οἶδα): impf. ἐκαθήμην or unaugmented-looking καθῆστο/καθῆτο (D.). No future/aorist — supplied by καθέζομαι (fut. καθεδοῦμαι) and καθίζω (ἐκάθισα).
    categories: ['pres.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'κάθημαι' }
    },
  },
  pp_kaio: {
    kind: 'verb', label: 'καίω (burn)', literal: true,
    subtitle: 'καίω, καύσω, ἔκαυσα, κέκαυμαι, ἐκαύθην — burn',
    example: { lemma: 'καίω', class: 'pp_kaio', meaning: 'burn' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': ['καίω', 'κάω'] },
      'fut.act': { '1sg': 'καύσω' },
      'aor.act': { '1sg': 'ἔκαυσα' },
      'perf.mp': { '1sg': 'κέκαυμαι' },
      'aor.pass': { '1sg': 'ἐκαύθην' }
    },
  },
  pp_kaleo: {
    kind: 'verb', label: 'καλέω (call)', literal: true,
    subtitle: 'καλέω, καλῶ, ἐκάλεσα, κέκληκα, κέκλημαι, ἐκλήθην — call',
    example: { lemma: 'καλέω', class: 'pp_kaleo', meaning: 'call' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'καλέω' },
      'fut.act': { '1sg': 'καλῶ' },
      'aor.act': { '1sg': 'ἐκάλεσα' },
      'perf.act': { '1sg': 'κέκληκα' },
      'perf.mp': { '1sg': 'κέκλημαι' },
      'aor.pass': { '1sg': 'ἐκλήθην' }
    },
  },
  pp_kamno: {
    kind: 'verb', label: 'κάμνω (toil)', literal: true,
    subtitle: 'κάμνω, καμοῦμαι, ἔκαμον, κέκμηκα — toil',
    example: { lemma: 'κάμνω', class: 'pp_kamno', meaning: 'toil' },
    // Contract future καμοῦμαι; aor.2 ἔκαμον; pf. κέκμηκα 'am weary' (οἱ κεκμηκότες = the dead).
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'κάμνω' },
      'fut.act': { '1sg': 'καμοῦμαι' },
      'aor.act': { '1sg': 'ἔκαμον' },
      'perf.act': { '1sg': 'κέκμηκα' }
    },
  },
  pp_kartereo: {
    kind: 'verb', label: 'καρτερέω (endure)', literal: true,
    subtitle: 'καρτερέω, καρτερήσω, ἐκαρτέρησα — endure',
    example: { lemma: 'καρτερέω', class: 'pp_kartereo', meaning: 'endure' },
    // Regular -έω (LSJ header lists no forms); pf. pass. only impersonal κεκαρτέρηται (E. Hipp.).
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'καρτερέω' },
      'fut.act': { '1sg': 'καρτερήσω' },
      'aor.act': { '1sg': 'ἐκαρτέρησα' }
    },
  },
  pp_katagignosko: {
    kind: 'verb', label: 'καταγιγνώσκω (accuse, condemn (+ gen. of pers., acc. of thing))', literal: true,
    subtitle: 'καταγιγνώσκω, καταγνώσομαι, κατέγνων, κατέγνωκα, κατέγνωσμαι, κατεγνώσθην — accuse, condemn (+ gen. of pers., acc. of thing)',
    example: { lemma: 'καταγιγνώσκω', class: 'pp_katagignosko', meaning: 'accuse, condemn (+ gen. of pers., acc. of thing)' },
    // γιγνώσκω pattern with κατα-: fut. mid. καταγνώσομαι (Pl.); κατεγνωσμένος 'condemned/despised'. (The row whose missing sigma was the shipped 2026.08.26.1 typo fix.)
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'καταγιγνώσκω' },
      'fut.act': { '1sg': 'καταγνώσομαι' },
      'aor.act': { '1sg': 'κατέγνων' },
      'perf.act': { '1sg': 'κατέγνωκα' },
      'perf.mp': { '1sg': 'κατέγνωσμαι' },
      'aor.pass': { '1sg': 'κατεγνώσθην' }
    },
  },
  pp_katakrinomai: {
    kind: 'verb', label: 'κατακρίνομαι (condemn (+ acc. of pers.))', literal: true,
    subtitle: 'κατακρίνομαι, κατακριθήσομαι, κατακέκριμαι, κατεκρίθην — condemn (+ acc. of pers.)',
    example: { lemma: 'κατακρίνομαι', class: 'pp_katakrinomai', meaning: 'condemn (+ acc. of pers.)' },
    // Deck lemma is the passive 'be condemned': aor. κατεκρίθην (X. Ap.), plpf. κατεκέκριτο (Hdt.). Active κατακρίνω follows κρίνω (-κρινῶ, -έκρινα, -κέκρικα).
    categories: ['pres.act', 'fut.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'κατακρίνομαι' },
      'fut.act': { '1sg': 'κατακριθήσομαι' },
      'perf.mp': { '1sg': 'κατακέκριμαι' },
      'aor.pass': { '1sg': 'κατεκρίθην' }
    },
  },
  pp_katastrephomai: {
    kind: 'verb', label: 'καταστρέφομαι (subdue)', literal: true,
    subtitle: 'καταστρέφομαι, καταστρέψομαι, κατεστρεψάμην, κατέστραμμαι, κατεστράφην — subdue',
    example: { lemma: 'καταστρέφομαι', class: 'pp_katastrephomai', meaning: 'subdue' },
    // Middle 'subdue' (Hdt., Th., D.): aor. κατεστρεψάμην; pf. κατέστραμμαι in middle sense too (D. 4.6). Aor.2 pass. κατεστράφην 'was subdued'.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'καταστρέφομαι' },
      'fut.act': { '1sg': 'καταστρέψομαι' },
      'aor.act': { '1sg': 'κατεστρεψάμην' },
      'perf.mp': { '1sg': 'κατέστραμμαι' },
      'aor.pass': { '1sg': 'κατεστράφην' }
    },
  },
  pp_katecho: {
    kind: 'verb', label: 'κατέχω (restrain, hold back)', literal: true,
    subtitle: 'κατέχω, καθέξω, κατέσχον, κατέσχηκα — restrain, hold back',
    example: { lemma: 'κατέχω', class: 'pp_katecho', meaning: 'restrain, hold back' },
    // Double future like ἔχω: καθέξω (duration) / κατασχήσω (momentary). Aor. κατέσχον, imper. κατάσχες.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'κατέχω' },
      'fut.act': { '1sg': 'καθέξω' },
      'aor.act': { '1sg': 'κατέσχον' },
      'perf.act': { '1sg': 'κατέσχηκα' }
    },
  },
  pp_kategoreo: {
    kind: 'verb', label: 'κατηγορέω (accuse (+ gen. of pers., acc. of thing))', literal: true,
    subtitle: 'κατηγορέω, κατηγορήσω, κατηγόρησα, κατηγόρηκα, κατηγόρημαι, κατηγορήθην — accuse (+ gen. of pers., acc. of thing)',
    example: { lemma: 'κατηγορέω', class: 'pp_kategoreo', meaning: 'accuse (+ gen. of pers., acc. of thing)' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'κατηγορέω' },
      'fut.act': { '1sg': 'κατηγορήσω' },
      'aor.act': { '1sg': 'κατηγόρησα' },
      'perf.act': { '1sg': 'κατηγόρηκα' },
      'perf.mp': { '1sg': 'κατηγόρημαι' },
      'aor.pass': { '1sg': 'κατηγορήθην' }
    },
  },
  pp_keleuo: {
    kind: 'verb', label: 'κελεύω (order)', literal: true,
    subtitle: 'κελεύω, κελεύσω, ἐκέλευσα, κεκέλευκα, κεκέλευσμαι, ἐκελεύσθην — order',
    example: { lemma: 'κελεύω', class: 'pp_keleuo', meaning: 'order' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'κελεύω' },
      'fut.act': { '1sg': 'κελεύσω' },
      'aor.act': { '1sg': 'ἐκέλευσα' },
      'perf.act': { '1sg': 'κεκέλευκα' },
      'perf.mp': { '1sg': 'κεκέλευσμαι' },
      'aor.pass': { '1sg': 'ἐκελεύσθην' }
    },
  },
  pp_kerytto: {
    kind: 'verb', label: 'κηρύττω (announce)', literal: true,
    subtitle: 'κηρύττω, κηρύξω, ἐκήρυξα, κεκήρυχα, κεκήρυγμαι, ἐκηρύχθην — announce',
    example: { lemma: 'κηρύττω', class: 'pp_kerytto', meaning: 'announce' },
    // All six classical (κηρυχθῆναι Lys. 19.63). LSJ lemmatizes κηρύσσω — the deck now carries both spellings on the card.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'κηρύττω' },
      'fut.act': { '1sg': 'κηρύξω' },
      'aor.act': { '1sg': 'ἐκήρυξα' },
      'perf.act': { '1sg': 'κεκήρυχα' },
      'perf.mp': { '1sg': 'κεκήρυγμαι' },
      'aor.pass': { '1sg': 'ἐκηρύχθην' }
    },
  },
  pp_kineo: {
    kind: 'verb', label: 'κινέω (move)', literal: true,
    subtitle: 'κινέω, κινήσω, ἐκίνησα, κεκίνημαι, ἐκινήθην — move',
    example: { lemma: 'κινέω', class: 'pp_kineo', meaning: 'move' },
    // Regular -έω; fut. mid. κινήσομαι in passive sense (Pl., D.) beside κινηθήσομαι. Pf. act. not securely classical.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'κινέω' },
      'fut.act': { '1sg': 'κινήσω' },
      'aor.act': { '1sg': 'ἐκίνησα' },
      'perf.mp': { '1sg': 'κεκίνημαι' },
      'aor.pass': { '1sg': 'ἐκινήθην' }
    },
  },
  pp_klaio: {
    kind: 'verb', label: 'κλαίω (weep, cry)', literal: true,
    subtitle: 'κλαίω, κλαύσομαι, ἔκλαυσα, κέκλαυμαι — weep, cry',
    example: { lemma: 'κλαίω', class: 'pp_klaio', meaning: 'weep, cry' },
    // Old Att. κλάω. Fut. mid. κλαύσομαι (also κλαήσω D.); 'κλαύσει' = colloquial 'you'll be sorry'. Pf. pass. κέκλαυμαι A., S.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'κλαίω' },
      'fut.act': { '1sg': 'κλαύσομαι' },
      'aor.act': { '1sg': 'ἔκλαυσα' },
      'perf.mp': { '1sg': 'κέκλαυμαι' }
    },
  },
  pp_kleio: {
    kind: 'verb', label: 'κλείω (shut, close)', literal: true,
    subtitle: 'κλείω, κλείσω, ἔκλεισα, κέκλεικα, κέκλειμαι, ἐκλείσθην — shut, close',
    example: { lemma: 'κλείω', class: 'pp_kleio', meaning: 'shut, close' },
    // Old Attic spelling κλῄω (ἔκλῃσα Th., E.; κέκλῃμαι); κλείω is the later standard. Ion. κληΐω.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'κλείω' },
      'fut.act': { '1sg': 'κλείσω' },
      'aor.act': { '1sg': 'ἔκλεισα' },
      'perf.act': { '1sg': 'κέκλεικα' },
      'perf.mp': { '1sg': 'κέκλειμαι' },
      'aor.pass': { '1sg': 'ἐκλείσθην' }
    },
  },
  pp_klepto: {
    kind: 'verb', label: 'κλέπτω (steal)', literal: true,
    subtitle: 'κλέπτω, κλέψω, ἔκλεψα, κέκλοφα, κέκλεμμαι, ἐκλάπην — steal',
    example: { lemma: 'κλέπτω', class: 'pp_klepto', meaning: 'steal' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'κλέπτω' },
      'fut.act': { '1sg': 'κλέψω' },
      'aor.act': { '1sg': 'ἔκλεψα' },
      'perf.act': { '1sg': 'κέκλοφα' },
      'perf.mp': { '1sg': 'κέκλεμμαι' },
      'aor.pass': { '1sg': 'ἐκλάπην' }
    },
  },
  pp_klino: {
    kind: 'verb', label: 'κλίνω (bend, incline, make to lean)', literal: true,
    subtitle: 'κλίνω, κλινῶ, ἔκλινα, κέκλιμαι, ἐκλίθην — bend, incline, make to lean',
    example: { lemma: 'κλίνω', class: 'pp_klino', meaning: 'bend, incline, make to lean' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'κλίνω' },
      'fut.act': { '1sg': 'κλινῶ' },
      'aor.act': { '1sg': 'ἔκλινα' },
      'perf.mp': { '1sg': 'κέκλιμαι' },
      'aor.pass': { '1sg': 'ἐκλίθην' }
    },
  },
  pp_klyo: {
    kind: 'verb', label: 'κλύω (hear)', literal: true,
    subtitle: 'κλύω — hear',
    example: { lemma: 'κλύω', class: 'pp_klyo', meaning: 'hear' },
    // Poetic verb: pres. + impf. ἔκλυον (with aorist force), imper. κλῦθι/κλῦτε. Prose uses ἀκούω.
    categories: ['pres.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'κλύω' }
    },
  },
  pp_kolazo: {
    kind: 'verb', label: 'κολάζω (punish)', literal: true,
    subtitle: 'κολάζω, κολάσω, ἐκόλασα, κεκόλασμαι, ἐκολάσθην — punish',
    example: { lemma: 'κολάζω', class: 'pp_kolazo', meaning: 'punish' },
    // fut. κολάσω (not -ιῶ); mid. fut. κολάσομαι/Ar. contr. κολῶμαι 'have someone punished'. Fut. pass. κολασθήσομαι Th.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'κολάζω' },
      'fut.act': { '1sg': 'κολάσω' },
      'aor.act': { '1sg': 'ἐκόλασα' },
      'perf.mp': { '1sg': 'κεκόλασμαι' },
      'aor.pass': { '1sg': 'ἐκολάσθην' }
    },
  },
  pp_komizo: {
    kind: 'verb', label: 'κομίζω (convey, carry, bring)', literal: true,
    subtitle: 'κομίζω, κομιῶ, ἐκόμισα, κεκόμικα, κεκόμισμαι, ἐκομίσθην — convey, carry, bring',
    example: { lemma: 'κομίζω', class: 'pp_komizo', meaning: 'convey, carry, bring' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'κομίζω' },
      'fut.act': { '1sg': 'κομιῶ' },
      'aor.act': { '1sg': 'ἐκόμισα' },
      'perf.act': { '1sg': 'κεκόμικα' },
      'perf.mp': { '1sg': 'κεκόμισμαι' },
      'aor.pass': { '1sg': 'ἐκομίσθην' }
    },
  },
  pp_kopto: {
    kind: 'verb', label: 'κόπτω (cut)', literal: true,
    subtitle: 'κόπτω, κόψω, ἔκοψα, κέκομμαι — cut',
    example: { lemma: 'κόπτω', class: 'pp_kopto', meaning: 'cut' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'κόπτω' },
      'fut.act': { '1sg': 'κόψω' },
      'aor.act': { '1sg': 'ἔκοψα' },
      'perf.mp': { '1sg': 'κέκομμαι' }
    },
  },
  pp_kosmeo: {
    kind: 'verb', label: 'κοσμέω (adorn, arrange)', literal: true,
    subtitle: 'κοσμέω, κοσμήσω, ἐκόσμησα, κεκόσμημαι, ἐκοσμήθην — adorn, arrange',
    example: { lemma: 'κοσμέω', class: 'pp_kosmeo', meaning: 'adorn, arrange' },
    // Regular -έω; pf. pass. κεκόσμημαι common (Hdt., Pl.).
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'κοσμέω' },
      'fut.act': { '1sg': 'κοσμήσω' },
      'aor.act': { '1sg': 'ἐκόσμησα' },
      'perf.mp': { '1sg': 'κεκόσμημαι' },
      'aor.pass': { '1sg': 'ἐκοσμήθην' }
    },
  },
  pp_krateo: {
    kind: 'verb', label: 'κρατέω (rule, conquer (+ gen.))', literal: true,
    subtitle: 'κρατέω, κρατήσω, ἐκράτησα, κεκράτηκα, κεκράτημαι, ἐκρατήθην — rule, conquer (+ gen.)',
    example: { lemma: 'κρατέω', class: 'pp_krateo', meaning: 'rule, conquer (+ gen.)' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'κρατέω' },
      'fut.act': { '1sg': 'κρατήσω' },
      'aor.act': { '1sg': 'ἐκράτησα' },
      'perf.act': { '1sg': 'κεκράτηκα' },
      'perf.mp': { '1sg': 'κεκράτημαι' },
      'aor.pass': { '1sg': 'ἐκρατήθην' }
    },
  },
  pp_krino: {
    kind: 'verb', label: 'κρίνω (judge)', literal: true,
    subtitle: 'κρίνω, κρινῶ, ἔκρινα, κέκρικα, κέκριμαι, ἐκρίθην — judge',
    example: { lemma: 'κρίνω', class: 'pp_krino', meaning: 'judge' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'κρίνω' },
      'fut.act': { '1sg': 'κρινῶ' },
      'aor.act': { '1sg': 'ἔκρινα' },
      'perf.act': { '1sg': 'κέκρικα' },
      'perf.mp': { '1sg': 'κέκριμαι' },
      'aor.pass': { '1sg': 'ἐκρίθην' }
    },
  },
  pp_krypto: {
    kind: 'verb', label: 'κρύπτω (hide)', literal: true,
    subtitle: 'κρύπτω, κρύψω, ἔκρυψα, κέκρυμμαι, ἐκρύφθην — hide',
    example: { lemma: 'κρύπτω', class: 'pp_krypto', meaning: 'hide' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'κρύπτω' },
      'fut.act': { '1sg': 'κρύψω' },
      'aor.act': { '1sg': 'ἔκρυψα' },
      'perf.mp': { '1sg': 'κέκρυμμαι' },
      'aor.pass': { '1sg': 'ἐκρύφθην' }
    },
  },
  pp_ktaomai: {
    kind: 'verb', label: 'κτάομαι (obtain)', literal: true,
    subtitle: 'κτάομαι, κτήσομαι, ἐκτησάμην, κέκτημαι, ἐκτήθην — obtain',
    example: { lemma: 'κτάομαι', class: 'pp_ktaomai', meaning: 'obtain' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'κτάομαι' },
      'fut.act': { '1sg': 'κτήσομαι' },
      'aor.act': { '1sg': 'ἐκτησάμην' },
      'perf.mp': { '1sg': 'κέκτημαι' },
      'aor.pass': { '1sg': 'ἐκτήθην' }
    },
  },
  pp_kteino: {
    kind: 'verb', label: 'κτείνω (kill)', literal: true,
    subtitle: 'κτείνω, κτενῶ, ἔκτεινα — kill',
    example: { lemma: 'κτείνω', class: 'pp_kteino', meaning: 'kill' },
    // Poet./early; in Attic prose ἀποκτείνω prevailed (its pf. = ἀπέκτονα). No uncompounded perfect; 'be killed' is supplied by ἀποθνῄσκω. Poet. aor.2 ἔκτανον.
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'κτείνω' },
      'fut.act': { '1sg': 'κτενῶ' },
      'aor.act': { '1sg': 'ἔκτεινα' }
    },
  },
  pp_kyreo: {
    kind: 'verb', label: 'κυρέω (meet with (+ gen.), happen)', literal: true,
    subtitle: 'κυρέω, κυρήσω, ἐκύρησα — meet with (+ gen.), happen',
    example: { lemma: 'κυρέω', class: 'pp_kyreo', meaning: 'meet with (+ gen.), happen' },
    // Poetic/Ionic ('meet with, obtain'); side-form κύρω, aor. ἔκυρσα. Prose says τυγχάνω. Short-vowel danger avoided: -ήσω is correct here.
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'κυρέω' },
      'fut.act': { '1sg': 'κυρήσω' },
      'aor.act': { '1sg': 'ἐκύρησα' }
    },
  },
  pp_kolyo: {
    kind: 'verb', label: 'κωλύω (hinder)', literal: true,
    subtitle: 'κωλύω, κωλύσω, ἐκώλυσα, κεκώλυκα, κεκώλυμαι, ἐκωλύθην — hinder',
    example: { lemma: 'κωλύω', class: 'pp_kolyo', meaning: 'hinder' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'κωλύω' },
      'fut.act': { '1sg': 'κωλύσω' },
      'aor.act': { '1sg': 'ἐκώλυσα' },
      'perf.act': { '1sg': 'κεκώλυκα' },
      'perf.mp': { '1sg': 'κεκώλυμαι' },
      'aor.pass': { '1sg': 'ἐκωλύθην' }
    },
  },
  pp_lagchano: {
    kind: 'verb', label: 'λαγχάνω (obtain by lot)', literal: true,
    subtitle: 'λαγχάνω, λήξομαι, ἔλαχον, εἴληχα, εἴληγμαι, ἐλήχθην — obtain by lot',
    example: { lemma: 'λαγχάνω', class: 'pp_lagchano', meaning: 'obtain by lot' },
    // All six: fut. mid. λήξομαι; pf. εἴληχα (poet./Ion. λέλογχα); pass. aor. ἐλήχθην in law contexts (Lys., D.).
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'λαγχάνω' },
      'fut.act': { '1sg': 'λήξομαι' },
      'aor.act': { '1sg': 'ἔλαχον' },
      'perf.act': { '1sg': 'εἴληχα' },
      'perf.mp': { '1sg': 'εἴληγμαι' },
      'aor.pass': { '1sg': 'ἐλήχθην' }
    },
  },
  pp_lambano: {
    kind: 'verb', label: 'λαμβάνω (take)', literal: true,
    subtitle: 'λαμβάνω, λήψομαι, ἔλαβον, εἴληφα, εἴλημμαι, ἐλήφθην — take',
    example: { lemma: 'λαμβάνω', class: 'pp_lambano', meaning: 'take' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'λαμβάνω' },
      'fut.act': { '1sg': 'λήψομαι' },
      'aor.act': { '1sg': 'ἔλαβον' },
      'perf.act': { '1sg': 'εἴληφα' },
      'perf.mp': { '1sg': 'εἴλημμαι' },
      'aor.pass': { '1sg': 'ἐλήφθην' }
    },
  },
  pp_lanthano: {
    kind: 'verb', label: 'λανθάνω (lie hid, escape notice (of))', literal: true,
    subtitle: 'λανθάνω, λήσω, ἔλαθον, λέληθα — lie hid, escape notice (of)',
    example: { lemma: 'λανθάνω', class: 'pp_lanthano', meaning: 'lie hid, escape notice (of)' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'λανθάνω' },
      'fut.act': { '1sg': 'λήσω' },
      'aor.act': { '1sg': 'ἔλαθον' },
      'perf.act': { '1sg': 'λέληθα' }
    },
  },
  pp_lego: {
    kind: 'verb', label: 'λέγω (say)', literal: true,
    subtitle: 'λέγω, λέξω, ἔλεξα, λέλεγμαι, ἐλέχθην — say',
    example: { lemma: 'λέγω', class: 'pp_lego', meaning: 'say' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'λέγω' },
      'fut.act': { '1sg': 'λέξω' },
      'aor.act': { '1sg': 'ἔλεξα' },
      'perf.mp': { '1sg': 'λέλεγμαι' },
      'aor.pass': { '1sg': 'ἐλέχθην' }
    },
  },
  pp_leipo: {
    kind: 'verb', label: 'λείπω (leave)', literal: true,
    subtitle: 'λείπω, λείψω, ἔλιπον, λέλοιπα, λέλειμμαι, ἐλείφθην — leave',
    example: { lemma: 'λείπω', class: 'pp_leipo', meaning: 'leave' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'λείπω' },
      'fut.act': { '1sg': 'λείψω' },
      'aor.act': { '1sg': 'ἔλιπον' },
      'perf.act': { '1sg': 'λέλοιπα' },
      'perf.mp': { '1sg': 'λέλειμμαι' },
      'aor.pass': { '1sg': 'ἐλείφθην' }
    },
  },
  pp_leusso: {
    kind: 'verb', label: 'λεύσσω (behold)', literal: true,
    subtitle: 'λεύσσω — behold',
    example: { lemma: 'λεύσσω', class: 'pp_leusso', meaning: 'behold' },
    // Poetic; good authors use only pres./impf. One of the native -σσ- verbs (no Attic -ττ- form).
    categories: ['pres.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'λεύσσω' }
    },
  },
  pp_legocease: {
    kind: 'verb', label: 'λήγω (cease, desist)', literal: true,
    subtitle: 'λήγω, λήξω, ἔληξα — cease, desist',
    example: { lemma: 'λήγω', class: 'pp_legocease', meaning: 'cease, desist' },
    // 'Cease': fut. λήξω, aor. ἔληξα; no perfect or passive system in classical use.
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'λήγω' },
      'fut.act': { '1sg': 'λήξω' },
      'aor.act': { '1sg': 'ἔληξα' }
    },
  },
  pp_lissomai: {
    kind: 'verb', label: 'λίσσομαι (beg)', literal: true,
    subtitle: 'λίσσομαι, ἐλισάμην — beg',
    example: { lemma: 'λίσσομαι', class: 'pp_lissomai', meaning: 'beg' },
    // Poetic ('beseech'); aor.1 ἐλισάμην, poet. aor.2 λιτέσθαι — cf. the side-form λίτομαι the card carries. Prose uses δέομαι, ἱκετεύω.
    categories: ['pres.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'λίσσομαι' },
      'aor.act': { '1sg': 'ἐλισάμην' }
    },
  },
  pp_logizomai: {
    kind: 'verb', label: 'λογίζομαι (consider)', literal: true,
    subtitle: 'λογίζομαι, λογιοῦμαι, ἐλογισάμην, λελόγισμαι — consider',
    example: { lemma: 'λογίζομαι', class: 'pp_logizomai', meaning: 'consider' },
    // Deponent; Attic contract future λογιοῦμαι; pf. λελόγισμαι also in passive sense ('stands reckoned', Lys.).
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'λογίζομαι' },
      'fut.act': { '1sg': 'λογιοῦμαι' },
      'aor.act': { '1sg': 'ἐλογισάμην' },
      'perf.mp': { '1sg': 'λελόγισμαι' }
    },
  },
  pp_loidoreo: {
    kind: 'verb', label: 'λοιδορέω (abuse)', literal: true,
    subtitle: 'λοιδορέω, λοιδορήσω, ἐλοιδόρησα, λελοιδόρηκα, ἐλοιδορήθην — abuse',
    example: { lemma: 'λοιδορέω', class: 'pp_loidoreo', meaning: 'abuse' },
    // Pf. λελοιδόρηκα Pl. Phdr. As middle 'rail at (+dat.)' the Attic aorist is the passive-form ἐλοιδορήθην (D.), commoner than ἐλοιδορησάμην.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'λοιδορέω' },
      'fut.act': { '1sg': 'λοιδορήσω' },
      'aor.act': { '1sg': 'ἐλοιδόρησα' },
      'perf.act': { '1sg': 'λελοιδόρηκα' },
      'aor.pass': { '1sg': 'ἐλοιδορήθην' }
    },
  },
  pp_mainomai: {
    kind: 'verb', label: 'μαίνομαι (be mad)', literal: true,
    subtitle: 'μαίνομαι, μέμηνα, ἐμάνην — be mad',
    example: { lemma: 'μαίνομαι', class: 'pp_mainomai', meaning: 'be mad' },
    // 'Went mad' = aor.2 pass. ἐμάνην; pf. μέμηνα has present sense 'am raving'. No Attic future (μανοῦμαι Hdt. only). Act. μαίνω 'madden' rare.
    categories: ['pres.act', 'perf.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'μαίνομαι' },
      'perf.act': { '1sg': 'μέμηνα' },
      'aor.pass': { '1sg': 'ἐμάνην' }
    },
  },
  pp_manthano: {
    kind: 'verb', label: 'μανθάνω (learn)', literal: true,
    subtitle: 'μανθάνω, μαθήσομαι, ἔμαθον, μεμάθηκα — learn',
    example: { lemma: 'μανθάνω', class: 'pp_manthano', meaning: 'learn' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'μανθάνω' },
      'fut.act': { '1sg': 'μαθήσομαι' },
      'aor.act': { '1sg': 'ἔμαθον' },
      'perf.act': { '1sg': 'μεμάθηκα' }
    },
  },
  pp_martyromai: {
    kind: 'verb', label: 'μαρτύρομαι ((bear) witness)', literal: true,
    subtitle: 'μαρτύρομαι, ἐμαρτυράμην — (bear) witness',
    example: { lemma: 'μαρτύρομαι', class: 'pp_martyromai', meaning: '(bear) witness' },
    // 'Call to witness, protest'; aor. ἐμαρτυράμην Pl. Distinct from μαρτυρέω 'bear witness' (regular -έω, all six).
    categories: ['pres.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'μαρτύρομαι' },
      'aor.act': { '1sg': 'ἐμαρτυράμην' }
    },
  },
  pp_machomai: {
    kind: 'verb', label: 'μάχομαι (fight (+ dat.))', literal: true,
    subtitle: 'μάχομαι, μαχοῦμαι, ἐμαχεσάμην, μεμάχημαι — fight (+ dat.)',
    example: { lemma: 'μάχομαι', class: 'pp_machomai', meaning: 'fight (+ dat.)' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'μάχομαι' },
      'fut.act': { '1sg': 'μαχοῦμαι' },
      'aor.act': { '1sg': 'ἐμαχεσάμην' },
      'perf.mp': { '1sg': 'μεμάχημαι' }
    },
  },
  pp_mello: {
    kind: 'verb', label: 'μέλλω (intend)', literal: true,
    subtitle: 'μέλλω, μελλήσω, ἐμέλλησα — intend',
    example: { lemma: 'μέλλω', class: 'pp_mello', meaning: 'intend' },
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'μέλλω' },
      'fut.act': { '1sg': 'μελλήσω' },
      'aor.act': { '1sg': 'ἐμέλλησα' }
    },
  },
  pp_memnemai: {
    kind: 'verb', label: 'μέμνημαι (remember (+ gen.))', literal: true,
    subtitle: 'μέμνημαι, μεμνήσομαι, μέμνημαι, ἐμνήσθην — remember (+ gen.)',
    example: { lemma: 'μέμνημαι', class: 'pp_memnemai', meaning: 'remember (+ gen.)' },
    // Itself the pf. mid. of μιμνῄσκω, with present sense 'remember' (subj. μεμνῶμαι, opt. μεμνῄμην); fut. pf. μεμνήσομαι 'shall remember'; aor. ἐμνήσθην 'remembered, made mention'.
    categories: ['pres.act', 'fut.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'μέμνημαι' },
      'fut.act': { '1sg': 'μεμνήσομαι' },
      'perf.mp': { '1sg': 'μέμνημαι' },
      'aor.pass': { '1sg': 'ἐμνήσθην' }
    },
  },
  pp_memphomai: {
    kind: 'verb', label: 'μέμφομαι (blame)', literal: true,
    subtitle: 'μέμφομαι, μέμψομαι, ἐμεμψάμην — blame',
    example: { lemma: 'μέμφομαι', class: 'pp_memphomai', meaning: 'blame' },
    // Deponent; beside ἐμεμψάμην the passive-form aor. ἐμέμφθην is equally classical in the same active sense (Hdt., E., Th.).
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'μέμφομαι' },
      'fut.act': { '1sg': 'μέμψομαι' },
      'aor.act': { '1sg': 'ἐμεμψάμην' }
    },
  },
  pp_meno: {
    kind: 'verb', label: 'μένω (remain)', literal: true,
    subtitle: 'μένω, μενῶ, ἔμεινα, μεμένηκα — remain',
    example: { lemma: 'μένω', class: 'pp_meno', meaning: 'remain' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'μένω' },
      'fut.act': { '1sg': 'μενῶ' },
      'aor.act': { '1sg': 'ἔμεινα' },
      'perf.act': { '1sg': 'μεμένηκα' }
    },
  },
  pp_metecho: {
    kind: 'verb', label: 'μετέχω (have a share in (+ gen.))', literal: true,
    subtitle: 'μετέχω, μεθέξω, μετέσχον, μετέσχηκα — have a share in (+ gen.)',
    example: { lemma: 'μετέχω', class: 'pp_metecho', meaning: 'have a share in (+ gen.)' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'μετέχω' },
      'fut.act': { '1sg': ['μεθέξω', 'μετασχήσω'] },
      'aor.act': { '1sg': 'μετέσχον' },
      'perf.act': { '1sg': 'μετέσχηκα' }
    },
  },
  pp_mechanaomai: {
    kind: 'verb', label: 'μηχανάομαι (contrive)', literal: true,
    subtitle: 'μηχανάομαι, μηχανήσομαι, ἐμηχανησάμην, μεμηχάνημαι — contrive',
    example: { lemma: 'μηχανάομαι', class: 'pp_mechanaomai', meaning: 'contrive' },
    // Deponent; -η- after ν. Pf. μεμηχάνημαι also in pass. sense.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'μηχανάομαι' },
      'fut.act': { '1sg': 'μηχανήσομαι' },
      'aor.act': { '1sg': 'ἐμηχανησάμην' },
      'perf.mp': { '1sg': 'μεμηχάνημαι' }
    },
  },
  pp_mimno: {
    kind: 'verb', label: 'μίμνω (remain)', literal: true,
    subtitle: 'μίμνω — remain',
    example: { lemma: 'μίμνω', class: 'pp_mimno', meaning: 'remain' },
    // Poetic reduplicated form of μένω — parts are μένω's: μενῶ, ἔμεινα, μεμένηκα.
    categories: ['pres.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'μίμνω' }
    },
  },
  pp_miseo: {
    kind: 'verb', label: 'μισέω (hate)', literal: true,
    subtitle: 'μισέω, μισήσω, ἐμίσησα, μεμίσηκα, μεμίσημαι, ἐμισήθην — hate',
    example: { lemma: 'μισέω', class: 'pp_miseo', meaning: 'hate' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'μισέω' },
      'fut.act': { '1sg': 'μισήσω' },
      'aor.act': { '1sg': 'ἐμίσησα' },
      'perf.act': { '1sg': 'μεμίσηκα' },
      'perf.mp': { '1sg': 'μεμίσημαι' },
      'aor.pass': { '1sg': 'ἐμισήθην' }
    },
  },
  pp_naio: {
    kind: 'verb', label: 'ναίω (dwell)', literal: true,
    subtitle: 'ναίω — dwell',
    example: { lemma: 'ναίω', class: 'pp_naio', meaning: 'dwell' },
    // Poetic 'dwell': pres./impf. only in ordinary use (causal aor. ἔνασσα, pass. ἐνάσθην 'settled' are Epic). Prose οἰκέω.
    categories: ['pres.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ναίω' }
    },
  },
  pp_naumacheo: {
    kind: 'verb', label: 'ναυμαχέω (fight a sea-battle)', literal: true,
    subtitle: 'ναυμαχέω, ναυμαχήσω, ἐναυμάχησα — fight a sea-battle',
    example: { lemma: 'ναυμαχέω', class: 'pp_naumacheo', meaning: 'fight a sea-battle' },
    // Regular -έω (D. 18.208 τοὺς ναυμαχήσαντας); augments at the front (ἐναυμάχουν Th.).
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ναυμαχέω' },
      'fut.act': { '1sg': 'ναυμαχήσω' },
      'aor.act': { '1sg': 'ἐναυμάχησα' }
    },
  },
  pp_nemo: {
    kind: 'verb', label: 'νέμω (distribute, manage)', literal: true,
    subtitle: 'νέμω, νεμῶ, ἔνειμα, νενέμηκα, νενέμημαι, ἐνεμήθην — distribute, manage',
    example: { lemma: 'νέμω', class: 'pp_nemo', meaning: 'distribute, manage' },
    // Liquid fut. νεμῶ; mid. νέμομαι 'graze/possess' (fut. νεμοῦμαι, aor. ἐνειμάμην 'divided among themselves').
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'νέμω' },
      'fut.act': { '1sg': 'νεμῶ' },
      'aor.act': { '1sg': 'ἔνειμα' },
      'perf.act': { '1sg': 'νενέμηκα' },
      'perf.mp': { '1sg': 'νενέμημαι' },
      'aor.pass': { '1sg': 'ἐνεμήθην' }
    },
  },
  pp_nikao: {
    kind: 'verb', label: 'νικάω (conquer)', literal: true,
    subtitle: 'νικάω, νικήσω, ἐνίκησα, νενίκηκα, νενίκημαι, ἐνικήθην — conquer',
    example: { lemma: 'νικάω', class: 'pp_nikao', meaning: 'conquer' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'νικάω' },
      'fut.act': { '1sg': 'νικήσω' },
      'aor.act': { '1sg': 'ἐνίκησα' },
      'perf.act': { '1sg': 'νενίκηκα' },
      'perf.mp': { '1sg': 'νενίκημαι' },
      'aor.pass': { '1sg': 'ἐνικήθην' }
    },
  },
  pp_noeo: {
    kind: 'verb', label: 'νοέω (have in mind, recognise)', literal: true,
    subtitle: 'νοέω, νοήσω, ἐνόησα, νενόηκα, νενόημαι, ἐνοήθην — have in mind, recognise',
    example: { lemma: 'νοέω', class: 'pp_noeo', meaning: 'have in mind, recognise' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'νοέω' },
      'fut.act': { '1sg': 'νοήσω' },
      'aor.act': { '1sg': 'ἐνόησα' },
      'perf.act': { '1sg': 'νενόηκα' },
      'perf.mp': { '1sg': 'νενόημαι' },
      'aor.pass': { '1sg': 'ἐνοήθην' }
    },
  },
  pp_nomizo: {
    kind: 'verb', label: 'νομίζω (consider, think)', literal: true,
    subtitle: 'νομίζω, νομιῶ, ἐνόμισα, νενόμικα, νενόμισμαι, ἐνομίσθην — consider, think',
    example: { lemma: 'νομίζω', class: 'pp_nomizo', meaning: 'consider, think' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'νομίζω' },
      'fut.act': { '1sg': 'νομιῶ' },
      'aor.act': { '1sg': 'ἐνόμισα' },
      'perf.act': { '1sg': 'νενόμικα' },
      'perf.mp': { '1sg': 'νενόμισμαι' },
      'aor.pass': { '1sg': 'ἐνομίσθην' }
    },
  },
  pp_noseo: {
    kind: 'verb', label: 'νοσέω (be ill)', literal: true,
    subtitle: 'νοσέω, νοσήσω, ἐνόσησα, νενόσηκα — be ill',
    example: { lemma: 'νοσέω', class: 'pp_noseo', meaning: 'be ill' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'νοσέω' },
      'fut.act': { '1sg': 'νοσήσω' },
      'aor.act': { '1sg': 'ἐνόσησα' },
      'perf.act': { '1sg': 'νενόσηκα' }
    },
  },
  pp_odyromai: {
    kind: 'verb', label: 'ὀδύρομαι (lament)', literal: true,
    subtitle: 'ὀδύρομαι, ὀδυροῦμαι, ὠδυράμην — lament',
    example: { lemma: 'ὀδύρομαι', class: 'pp_odyromai', meaning: 'lament' },
    // Mostly pres./impf.; fut. ὀδυροῦμαι D., aor. ὠδυράμην Isoc.
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ὀδύρομαι' },
      'fut.act': { '1sg': 'ὀδυροῦμαι' },
      'aor.act': { '1sg': 'ὠδυράμην' }
    },
  },
  pp_oikeo: {
    kind: 'verb', label: 'οἰκέω (dwell, inhabit)', literal: true,
    subtitle: 'οἰκέω, οἰκήσω, ᾤκησα, ᾤκηκα, ᾤκημαι, ᾠκήθην — dwell, inhabit',
    example: { lemma: 'οἰκέω', class: 'pp_oikeo', meaning: 'dwell, inhabit' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'οἰκέω' },
      'fut.act': { '1sg': 'οἰκήσω' },
      'aor.act': { '1sg': 'ᾤκησα' },
      'perf.act': { '1sg': 'ᾤκηκα' },
      'perf.mp': { '1sg': 'ᾤκημαι' },
      'aor.pass': { '1sg': 'ᾠκήθην' }
    },
  },
  pp_oikteiro: {
    kind: 'verb', label: 'οἰκτείρω (pity)', literal: true,
    subtitle: 'οἰκτείρω, οἰκτερῶ, ᾤκτειρα — pity',
    example: { lemma: 'οἰκτείρω', class: 'pp_oikteiro', meaning: 'pity' },
    // Attic spelling οἰκτίρω (long ι). Liquid stem; no perfect; passive only pres.
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'οἰκτείρω' },
      'fut.act': { '1sg': 'οἰκτερῶ' },
      'aor.act': { '1sg': 'ᾤκτειρα' }
    },
  },
  pp_oimai: {
    kind: 'verb', label: 'οἶμαι (think)', literal: true,
    subtitle: 'οἶμαι, οἰήσομαι, ᾠήθην — think',
    example: { lemma: 'οἶμαι', class: 'pp_oimai', meaning: 'think' },
    categories: ['pres.act', 'fut.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': ['οἶμαι', 'οἴομαι'] },
      'fut.act': { '1sg': 'οἰήσομαι' },
      'aor.pass': { '1sg': 'ᾠήθην' }
    },
  },
  pp_oichomai: {
    kind: 'verb', label: 'οἴχομαι (am gone)', literal: true,
    subtitle: 'οἴχομαι, οἰχήσομαι, οἴχωκα — am gone',
    example: { lemma: 'οἴχομαι', class: 'pp_oichomai', meaning: 'am gone' },
    // 'Be gone' — present has perfect sense, impf. ᾠχόμην = 'had gone'. Pf. οἴχωκα S./Hdt. (ᾤχωκα A.); no aorist.
    categories: ['pres.act', 'fut.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'οἴχομαι' },
      'fut.act': { '1sg': 'οἰχήσομαι' },
      'perf.act': { '1sg': 'οἴχωκα' }
    },
  },
  pp_okneo: {
    kind: 'verb', label: 'ὀκνέω (shrink from)', literal: true,
    subtitle: 'ὀκνέω, ὀκνήσω, ὤκνησα — shrink from',
    example: { lemma: 'ὀκνέω', class: 'pp_okneo', meaning: 'shrink from' },
    // Regular -έω.
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ὀκνέω' },
      'fut.act': { '1sg': 'ὀκνήσω' },
      'aor.act': { '1sg': 'ὤκνησα' }
    },
  },
  pp_oligoreo: {
    kind: 'verb', label: 'ὀλιγωρέω (despise, disdain)', literal: true,
    subtitle: 'ὀλιγωρέω, ὀλιγωρήσω, ὠλιγώρησα, ὠλιγώρημαι — despise, disdain',
    example: { lemma: 'ὀλιγωρέω', class: 'pp_oligoreo', meaning: 'despise, disdain' },
    // Regular -έω, +gen.; pf. pass. τοῖς ὠλιγωρημένοις D.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ὀλιγωρέω' },
      'fut.act': { '1sg': 'ὀλιγωρήσω' },
      'aor.act': { '1sg': 'ὠλιγώρησα' },
      'perf.mp': { '1sg': 'ὠλιγώρημαι' }
    },
  },
  pp_ollymi: {
    kind: 'verb', label: 'ὄλλυμι (destroy)', literal: true,
    subtitle: 'ὄλλυμι, ὀλῶ, ὤλεσα, ὄλωλα — destroy',
    example: { lemma: 'ὄλλυμι', class: 'pp_ollymi', meaning: 'destroy' },
    // Poet. simple verb; prose uses ἀπόλλυμι (ἀπολῶ, ἀπώλεσα, trans. pf. ἀπολώλεκα). Mid. 'perish': ὀλοῦμαι, ὠλόμην; pf. ὄλωλα intransitive 'am undone'.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ὄλλυμι' },
      'fut.act': { '1sg': 'ὀλῶ' },
      'aor.act': { '1sg': 'ὤλεσα' },
      'perf.act': { '1sg': 'ὄλωλα' }
    },
  },
  pp_olophyromai: {
    kind: 'verb', label: 'ὀλοφύρομαι (lament)', literal: true,
    subtitle: 'ὀλοφύρομαι, ὀλοφυροῦμαι, ὠλοφυράμην — lament',
    example: { lemma: 'ὀλοφύρομαι', class: 'pp_olophyromai', meaning: 'lament' },
    // Aor. pass. part. ὀλοφυρθείς in same sense (Th. 6.78).
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ὀλοφύρομαι' },
      'fut.act': { '1sg': 'ὀλοφυροῦμαι' },
      'aor.act': { '1sg': 'ὠλοφυράμην' }
    },
  },
  pp_homileo: {
    kind: 'verb', label: 'ὁμιλέω (associate with)', literal: true,
    subtitle: 'ὁμιλέω, ὁμιλήσω, ὡμίλησα — associate with',
    example: { lemma: 'ὁμιλέω', class: 'pp_homileo', meaning: 'associate with' },
    // Regular -έω (LSJ header lists no forms).
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ὁμιλέω' },
      'fut.act': { '1sg': 'ὁμιλήσω' },
      'aor.act': { '1sg': 'ὡμίλησα' }
    },
  },
  pp_omnymi: {
    kind: 'verb', label: 'ὄμνυμι (swear)', literal: true,
    subtitle: 'ὄμνυμι, ὀμοῦμαι, ὤμοσα, ὀμώμοκα, ὀμώμοσμαι, ὠμόσθην — swear',
    example: { lemma: 'ὄμνυμι', class: 'pp_omnymi', meaning: 'swear' },
    // LSJ-checked 2026-08-30, review closed. The source row was garbled (a value
    // split mid-word across two slots) and had left the future as ὀμέομαι --
    // a form LSJ does not record anywhere in the entry, and one no one writes:
    // LSJ gives "fut. ὀμοῦμαι (Il., Hes., Ar., Lys., X.HG)", with ὀμόσω marked
    // later. Corrected to ὀμοῦμαι, along with the twenty other uncontracted
    // futures found in the same sweep (see this batch's header comment).
    // The other two slots are confirmed as the right choice of the pair the
    // source offered: perf.mp ὀμώμοσμαι (LSJ's 3sg ὀμώμοσται, part.
    // ὀμωμοσμένος in D. and Arist. -- the σ-less ὀμώμοται is also attested but
    // is the tragic one), and aor. pass. ὠμόσθην (X. HG 7.4.10), which LSJ
    // lists before "but ὠμόθην (Is. 2.40)".
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ὄμνυμι' },
      'fut.act': { '1sg': 'ὀμοῦμαι' },
      'aor.act': { '1sg': 'ὤμοσα' },
      'perf.act': { '1sg': 'ὀμώμοκα' },
      'perf.mp': { '1sg': 'ὀμώμοσμαι' },
      'aor.pass': { '1sg': 'ὠμόσθην' }
    },
  },
  pp_homologeo: {
    kind: 'verb', label: 'ὁμολογέω (agree)', literal: true,
    subtitle: 'ὁμολογέω, ὁμολογήσω, ὡμολόγησα, ὡμολόγηκα, ὡμολόγημαι, ὡμολογήθην — agree',
    example: { lemma: 'ὁμολογέω', class: 'pp_homologeo', meaning: 'agree' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ὁμολογέω' },
      'fut.act': { '1sg': 'ὁμολογήσω' },
      'aor.act': { '1sg': 'ὡμολόγησα' },
      'perf.act': { '1sg': 'ὡμολόγηκα' },
      'perf.mp': { '1sg': 'ὡμολόγημαι' },
      'aor.pass': { '1sg': 'ὡμολογήθην' }
    },
  },
  pp_oneidizo: {
    kind: 'verb', label: 'ὀνειδίζω (revile (+ dat.))', literal: true,
    subtitle: 'ὀνειδίζω, ὀνειδιῶ, ὠνείδισα, ὠνείδικα — revile (+ dat.)',
    example: { lemma: 'ὀνειδίζω', class: 'pp_oneidizo', meaning: 'revile (+ dat.)' },
    // Att. contract fut. -ιῶ; pf. ὠνείδικα Lys. 16.15.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ὀνειδίζω' },
      'fut.act': { '1sg': 'ὀνειδιῶ' },
      'aor.act': { '1sg': 'ὠνείδισα' },
      'perf.act': { '1sg': 'ὠνείδικα' }
    },
  },
  pp_onomazo: {
    kind: 'verb', label: 'ὀνομάζω (name)', literal: true,
    subtitle: 'ὀνομάζω, ὀνομάσω, ὠνόμασα, ὠνόμακα, ὠνόμασμαι, ὠνομάσθην — name',
    example: { lemma: 'ὀνομάζω', class: 'pp_onomazo', meaning: 'name' },
    // All six classical (pf. ὠνόμακα Pl.).
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ὀνομάζω' },
      'fut.act': { '1sg': 'ὀνομάσω' },
      'aor.act': { '1sg': 'ὠνόμασα' },
      'perf.act': { '1sg': 'ὠνόμακα' },
      'perf.mp': { '1sg': 'ὠνόμασμαι' },
      'aor.pass': { '1sg': 'ὠνομάσθην' }
    },
  },
  pp_hoplizo: {
    kind: 'verb', label: 'ὁπλίζω (arm)', literal: true,
    subtitle: 'ὁπλίζω, ὥπλισα, ὥπλισμαι, ὡπλίσθην — arm',
    example: { lemma: 'ὁπλίζω', class: 'pp_hoplizo', meaning: 'arm' },
    // Future barely attested classically; mid. ὡπλισάμην 'armed oneself'.
    categories: ['pres.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ὁπλίζω' },
      'aor.act': { '1sg': 'ὥπλισα' },
      'perf.mp': { '1sg': 'ὥπλισμαι' },
      'aor.pass': { '1sg': 'ὡπλίσθην' }
    },
  },
  pp_horao: {
    kind: 'verb', label: 'ὁράω (see)', literal: true,
    subtitle: 'ὁράω, ὄψομαι, εἶδον, ἑώρακα, ἑώραμαι, ὤφθην — see',
    example: { lemma: 'ὁράω', class: 'pp_horao', meaning: 'see' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ὁράω' },
      'fut.act': { '1sg': 'ὄψομαι' },
      'aor.act': { '1sg': 'εἶδον' },
      'perf.act': { '1sg': ['ἑώρακα', 'ἑόρακα'] },
      'perf.mp': { '1sg': ['ἑώραμαι', 'ὦμμαι'] },
      'aor.pass': { '1sg': 'ὤφθην' }
    },
  },
  pp_orgizomai: {
    kind: 'verb', label: 'ὀργίζομαι (be angry)', literal: true,
    subtitle: 'ὀργίζομαι, ὀργιοῦμαι, ὤργισμαι, ὠργίσθην — be angry',
    example: { lemma: 'ὀργίζομαι', class: 'pp_orgizomai', meaning: 'be angry' },
    categories: ['pres.act', 'fut.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ὀργίζομαι' },
      'fut.act': { '1sg': 'ὀργιοῦμαι' },
      'perf.mp': { '1sg': 'ὤργισμαι' },
      'aor.pass': { '1sg': 'ὠργίσθην' }
    },
  },
  pp_hormao: {
    kind: 'verb', label: 'ὁρμάω (rush; mid. set out)', literal: true,
    subtitle: 'ὁρμάω, ὁρμήσω, ὥρμησα, ὥρμηκα, ὥρμημαι, ὡρμήθην — rush; mid. set out',
    example: { lemma: 'ὁρμάω', class: 'pp_hormao', meaning: 'rush; mid. set out' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ὁρμάω' },
      'fut.act': { '1sg': 'ὁρμήσω' },
      'aor.act': { '1sg': 'ὥρμησα' },
      'perf.act': { '1sg': 'ὥρμηκα' },
      'perf.mp': { '1sg': 'ὥρμημαι' },
      'aor.pass': { '1sg': 'ὡρμήθην' }
    },
  },
  pp_opheilo: {
    kind: 'verb', label: 'ὀφείλω (owe)', literal: true,
    subtitle: 'ὀφείλω, ὀφειλήσω, ὠφείλησα, ὠφείληκα, ὠφειλήθην — owe',
    example: { lemma: 'ὀφείλω', class: 'pp_opheilo', meaning: 'owe' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ὀφείλω' },
      'fut.act': { '1sg': 'ὀφειλήσω' },
      'aor.act': { '1sg': ['ὠφείλησα', 'ὤφελον'] },
      'perf.act': { '1sg': 'ὠφείληκα' },
      'aor.pass': { '1sg': 'ὠφειλήθην' }
    },
  },
  pp_paideuo: {
    kind: 'verb', label: 'παιδεύω (educate)', literal: true,
    subtitle: 'παιδεύω, παιδεύσω, ἐπαίδευσα, πεπαίδευκα, πεπαίδευμαι, ἐπαιδεύθην — educate',
    example: { lemma: 'παιδεύω', class: 'pp_paideuo', meaning: 'educate' },
    // The grammars' paradigm verb; all six everywhere.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'παιδεύω' },
      'fut.act': { '1sg': 'παιδεύσω' },
      'aor.act': { '1sg': 'ἐπαίδευσα' },
      'perf.act': { '1sg': 'πεπαίδευκα' },
      'perf.mp': { '1sg': 'πεπαίδευμαι' },
      'aor.pass': { '1sg': 'ἐπαιδεύθην' }
    },
  },
  pp_paraineo: {
    kind: 'verb', label: 'παραινέω (advise)', literal: true,
    subtitle: 'παραινέω, παραινέσω, παρῄνεσα, παρῄνεκα, παρῄνημαι, παρῃνέθην — advise',
    example: { lemma: 'παραινέω', class: 'pp_paraineo', meaning: 'advise' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'παραινέω' },
      'fut.act': { '1sg': 'παραινέσω' },
      'aor.act': { '1sg': 'παρῄνεσα' },
      'perf.act': { '1sg': 'παρῄνεκα' },
      'perf.mp': { '1sg': 'παρῄνημαι' },
      'aor.pass': { '1sg': 'παρῃνέθην' }
    },
  },
  pp_parakeleuomai: {
    kind: 'verb', label: 'παρακελεύομαι (exhort, encourage (+ dat.))', literal: true,
    subtitle: 'παρακελεύομαι, παρακελεύσομαι, παρεκελευσάμην, παρακεκέλευσμαι — exhort, encourage (+ dat.)',
    example: { lemma: 'παρακελεύομαι', class: 'pp_parakeleuomai', meaning: 'exhort, encourage (+ dat.)' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'παρακελεύομαι' },
      'fut.act': { '1sg': 'παρακελεύσομαι' },
      'aor.act': { '1sg': 'παρεκελευσάμην' },
      'perf.mp': { '1sg': 'παρακεκέλευσμαι' }
    },
  },
  pp_paraskeuazo: {
    kind: 'verb', label: 'παρασκευάζω (prepare)', literal: true,
    subtitle: 'παρασκευάζω, παρασκευάσω, παρεσκεύασα, παρεσκεύασμαι, παρεσκευάσθην — prepare',
    example: { lemma: 'παρασκευάζω', class: 'pp_paraskeuazo', meaning: 'prepare' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'παρασκευάζω' },
      'fut.act': { '1sg': 'παρασκευάσω' },
      'aor.act': { '1sg': 'παρεσκεύασα' },
      'perf.mp': { '1sg': 'παρεσκεύασμαι' },
      'aor.pass': { '1sg': 'παρεσκευάσθην' }
    },
  },
  pp_pareimi: {
    kind: 'verb', label: 'πάρειμι (am present)', literal: true,
    subtitle: 'πάρειμι, παρέσομαι — am present',
    example: { lemma: 'πάρειμι', class: 'pp_pareimi', meaning: 'am present' },
    categories: ['pres.act', 'fut.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'πάρειμι' },
      'fut.act': { '1sg': 'παρέσομαι' }
    },
  },
  pp_parecho: {
    kind: 'verb', label: 'παρέχω (provide)', literal: true,
    subtitle: 'παρέχω, παρέξω, παρέσχον, παρέσχηκα — provide',
    example: { lemma: 'παρέχω', class: 'pp_parecho', meaning: 'provide' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'παρέχω' },
      'fut.act': { '1sg': ['παρέξω', 'παρασχήσω'] },
      'aor.act': { '1sg': 'παρέσχον' },
      'perf.act': { '1sg': 'παρέσχηκα' }
    },
  },
  pp_pascho: {
    kind: 'verb', label: 'πάσχω (suffer)', literal: true,
    subtitle: 'πάσχω, πείσομαι, ἔπαθον, πέπονθα — suffer',
    example: { lemma: 'πάσχω', class: 'pp_pascho', meaning: 'suffer' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'πάσχω' },
      'fut.act': { '1sg': 'πείσομαι' },
      'aor.act': { '1sg': 'ἔπαθον' },
      'perf.act': { '1sg': 'πέπονθα' }
    },
  },
  pp_pauo: {
    kind: 'verb', label: 'παύω (stop)', literal: true,
    subtitle: 'παύω, παύσω, ἔπαυσα, πέπαυκα, πέπαυμαι, ἐπαύθην — stop',
    example: { lemma: 'παύω', class: 'pp_pauo', meaning: 'stop' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'παύω' },
      'fut.act': { '1sg': 'παύσω' },
      'aor.act': { '1sg': 'ἔπαυσα' },
      'perf.act': { '1sg': 'πέπαυκα' },
      'perf.mp': { '1sg': 'πέπαυμαι' },
      'aor.pass': { '1sg': 'ἐπαύθην' }
    },
  },
  pp_peitho: {
    kind: 'verb', label: 'πείθω (persuade; mid. obey (+ dat.))', literal: true,
    subtitle: 'πείθω, πείσω, ἔπεισα, πέπεικα, πέπεισμαι, ἐπείσθην — persuade; mid. obey (+ dat.)',
    example: { lemma: 'πείθω', class: 'pp_peitho', meaning: 'persuade; mid. obey (+ dat.)' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'πείθω' },
      'fut.act': { '1sg': 'πείσω' },
      'aor.act': { '1sg': 'ἔπεισα' },
      'perf.act': { '1sg': 'πέπεικα' },
      'perf.mp': { '1sg': 'πέπεισμαι' },
      'aor.pass': { '1sg': 'ἐπείσθην' }
    },
  },
  pp_peiraomai: {
    kind: 'verb', label: 'πειράομαι (try)', literal: true,
    subtitle: 'πειράομαι, πειράσομαι, πεπείραμαι, ἐπειράθην — try',
    example: { lemma: 'πειράομαι', class: 'pp_peiraomai', meaning: 'try' },
    // -ᾱ- after ρ (πειράσομαι). Attic 'tried' is the passive-form ἐπειράθην; ἐπειρασάμην mostly Ionic. Act. πειράω 'test' also exists.
    categories: ['pres.act', 'fut.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'πειράομαι' },
      'fut.act': { '1sg': 'πειράσομαι' },
      'perf.mp': { '1sg': 'πεπείραμαι' },
      'aor.pass': { '1sg': 'ἐπειράθην' }
    },
  },
  pp_pempo: {
    kind: 'verb', label: 'πέμπω (send)', literal: true,
    subtitle: 'πέμπω, πέμψω, ἔπεμψα, πέπομφα, πέπεμμαι, ἐπέμφθην — send',
    example: { lemma: 'πέμπω', class: 'pp_pempo', meaning: 'send' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'πέμπω' },
      'fut.act': { '1sg': 'πέμψω' },
      'aor.act': { '1sg': 'ἔπεμψα' },
      'perf.act': { '1sg': 'πέπομφα' },
      'perf.mp': { '1sg': 'πέπεμμαι' },
      'aor.pass': { '1sg': 'ἐπέμφθην' }
    },
  },
  pp_peraino: {
    kind: 'verb', label: 'περαίνω (accomplish)', literal: true,
    subtitle: 'περαίνω, περανῶ, ἐπέρανα, πεπέρασμαι, ἐπεράνθην — accomplish',
    example: { lemma: 'περαίνω', class: 'pp_peraino', meaning: 'accomplish' },
    // Liquid stem; pf. part. πεπερασμένος 'finite' (Arist.).
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'περαίνω' },
      'fut.act': { '1sg': 'περανῶ' },
      'aor.act': { '1sg': 'ἐπέρανα' },
      'perf.mp': { '1sg': 'πεπέρασμαι' },
      'aor.pass': { '1sg': 'ἐπεράνθην' }
    },
  },
  pp_piezo: {
    kind: 'verb', label: 'πιέζω (oppress)', literal: true,
    subtitle: 'πιέζω, πιέσω, ἐπίεσα, ἐπιέσθην — oppress',
    example: { lemma: 'πιέζω', class: 'pp_piezo', meaning: 'oppress' },
    // σ-forms despite -ζω: aor. ἐπίεσα Hdt., Th.
    categories: ['pres.act', 'fut.act', 'aor.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'πιέζω' },
      'fut.act': { '1sg': 'πιέσω' },
      'aor.act': { '1sg': 'ἐπίεσα' },
      'aor.pass': { '1sg': 'ἐπιέσθην' }
    },
  },
  pp_pimplemi: {
    kind: 'verb', label: 'πίμπλημι (fill)', literal: true,
    subtitle: 'πίμπλημι, πλήσω, ἔπλησα, πέπληκα, πέπλησμαι, ἐπλήσθην — fill',
    example: { lemma: 'πίμπλημι', class: 'pp_pimplemi', meaning: 'fill' },
    // Tenses from πλη-; prose prefers the compound ἐμπίμπλημι.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'πίμπλημι' },
      'fut.act': { '1sg': 'πλήσω' },
      'aor.act': { '1sg': 'ἔπλησα' },
      'perf.act': { '1sg': 'πέπληκα' },
      'perf.mp': { '1sg': 'πέπλησμαι' },
      'aor.pass': { '1sg': 'ἐπλήσθην' }
    },
  },
  pp_pino: {
    kind: 'verb', label: 'πίνω (drink)', literal: true,
    subtitle: 'πίνω, πίομαι, ἔπιον, πέπωκα — drink',
    example: { lemma: 'πίνω', class: 'pp_pino', meaning: 'drink' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'πίνω' },
      'fut.act': { '1sg': ['πίομαι', 'πιέομαι'] },
      'aor.act': { '1sg': 'ἔπιον' },
      'perf.act': { '1sg': 'πέπωκα' }
    },
  },
  pp_pipto: {
    kind: 'verb', label: 'πίπτω (fall)', literal: true,
    subtitle: 'πίπτω, πεσοῦμαι, ἔπεσον, πέπτωκα — fall',
    example: { lemma: 'πίπτω', class: 'pp_pipto', meaning: 'fall' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'πίπτω' },
      'fut.act': { '1sg': 'πεσοῦμαι' },
      'aor.act': { '1sg': 'ἔπεσον' },
      'perf.act': { '1sg': 'πέπτωκα' }
    },
  },
  pp_pisteuo: {
    kind: 'verb', label: 'πιστεύω (believe, trust (+ dat.))', literal: true,
    subtitle: 'πιστεύω, πιστεύσω, ἐπίστευσα, πεπίστευκα, πεπίστευμαι, ἐπιστεύθην — believe, trust (+ dat.)',
    example: { lemma: 'πιστεύω', class: 'pp_pisteuo', meaning: 'believe, trust (+ dat.)' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'πιστεύω' },
      'fut.act': { '1sg': 'πιστεύσω' },
      'aor.act': { '1sg': 'ἐπίστευσα' },
      'perf.act': { '1sg': 'πεπίστευκα' },
      'perf.mp': { '1sg': 'πεπίστευμαι' },
      'aor.pass': { '1sg': 'ἐπιστεύθην' }
    },
  },
  pp_pleo: {
    kind: 'verb', label: 'πλέω (sail)', literal: true,
    subtitle: 'πλέω, πλεύσομαι, ἔπλευσα, πέπλευκα, πέπλευσμαι — sail',
    example: { lemma: 'πλέω', class: 'pp_pleo', meaning: 'sail' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'πλέω' },
      'fut.act': { '1sg': ['πλεύσομαι', 'πλευσέομαι'] },
      'aor.act': { '1sg': 'ἔπλευσα' },
      'perf.act': { '1sg': 'πέπλευκα' },
      'perf.mp': { '1sg': 'πέπλευσμαι' }
    },
  },
  pp_pleroo: {
    kind: 'verb', label: 'πληρόω (fill)', literal: true,
    subtitle: 'πληρόω, πληρώσω, ἐπλήρωσα, πεπλήρωκα, πεπλήρωμαι, ἐπληρώθην — fill',
    example: { lemma: 'πληρόω', class: 'pp_pleroo', meaning: 'fill' },
    // Regular -όω; all six.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'πληρόω' },
      'fut.act': { '1sg': 'πληρώσω' },
      'aor.act': { '1sg': 'ἐπλήρωσα' },
      'perf.act': { '1sg': 'πεπλήρωκα' },
      'perf.mp': { '1sg': 'πεπλήρωμαι' },
      'aor.pass': { '1sg': 'ἐπληρώθην' }
    },
  },
  pp_pneo: {
    kind: 'verb', label: 'πνέω (breathe, blow)', literal: true,
    subtitle: 'πνέω, πνεύσομαι, ἔπνευσα — breathe, blow',
    example: { lemma: 'πνέω', class: 'pp_pneo', meaning: 'breathe, blow' },
    // Monosyllabic ε-stem: πνεύσομαι/πνευσοῦμαι (Ar.), NOT -ήσω. Pf. πέπνευκα in compounds (Pl.).
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'πνέω' },
      'fut.act': { '1sg': 'πνεύσομαι' },
      'aor.act': { '1sg': 'ἔπνευσα' }
    },
  },
  pp_potheo: {
    kind: 'verb', label: 'ποθέω (desire)', literal: true,
    subtitle: 'ποθέω, ποθήσω, ἐπόθησα — desire',
    example: { lemma: 'ποθέω', class: 'pp_potheo', meaning: 'desire' },
    // Double stem: also fut. ποθέσομαι (Lys., Pl.) and aor. ἐπόθεσα (Isoc.) with short vowel — both classical.
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ποθέω' },
      'fut.act': { '1sg': 'ποθήσω' },
      'aor.act': { '1sg': 'ἐπόθησα' }
    },
  },
  pp_poliorkeo: {
    kind: 'verb', label: 'πολιορκέω (besiege)', literal: true,
    subtitle: 'πολιορκέω, πολιορκήσω, ἐπολιόρκησα, ἐπολιορκήθην — besiege',
    example: { lemma: 'πολιορκέω', class: 'pp_poliorkeo', meaning: 'besiege' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'πολιορκέω' },
      'fut.act': { '1sg': 'πολιορκήσω' },
      'aor.act': { '1sg': 'ἐπολιόρκησα' },
      'aor.pass': { '1sg': 'ἐπολιορκήθην' }
    },
  },
  pp_poreuomai: {
    kind: 'verb', label: 'πορεύομαι (march, journey)', literal: true,
    subtitle: 'πορεύομαι, πορεύσομαι, πεπόρευμαι, ἐπορεύθην — march, journey',
    example: { lemma: 'πορεύομαι', class: 'pp_poreuomai', meaning: 'march, journey' },
    // Passive deponent: 'travelled' = ἐπορεύθην (X. passim). Act. πορεύω 'convey' (E., X.).
    categories: ['pres.act', 'fut.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'πορεύομαι' },
      'fut.act': { '1sg': 'πορεύσομαι' },
      'perf.mp': { '1sg': 'πεπόρευμαι' },
      'aor.pass': { '1sg': 'ἐπορεύθην' }
    },
  },
  pp_porizo: {
    kind: 'verb', label: 'πορίζω (provide)', literal: true,
    subtitle: 'πορίζω, ποριῶ, ἐπόρισα, πεπόρικα, πεπόρισμαι, ἐπορίσθην — provide',
    example: { lemma: 'πορίζω', class: 'pp_porizo', meaning: 'provide' },
    // Att. contract fut. ποριῶ; all six classical; mid. 'procure for oneself'.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'πορίζω' },
      'fut.act': { '1sg': 'ποριῶ' },
      'aor.act': { '1sg': 'ἐπόρισα' },
      'perf.act': { '1sg': 'πεπόρικα' },
      'perf.mp': { '1sg': 'πεπόρισμαι' },
      'aor.pass': { '1sg': 'ἐπορίσθην' }
    },
  },
  pp_pratto: {
    kind: 'verb', label: 'πράττω (do)', literal: true,
    subtitle: 'πράττω, πράξω, ἔπραξα, πέπραγα, πέπραγμαι, ἐπράχθην — do',
    example: { lemma: 'πράττω', class: 'pp_pratto', meaning: 'do' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'πράττω' },
      'fut.act': { '1sg': 'πράξω' },
      'aor.act': { '1sg': 'ἔπραξα' },
      'perf.act': { '1sg': ['πέπραγα', 'πέπραχα'] },
      'perf.mp': { '1sg': 'πέπραγμαι' },
      'aor.pass': { '1sg': 'ἐπράχθην' }
    },
  },
  pp_prodidomi: {
    kind: 'verb', label: 'προδίδωμι (betray)', literal: true,
    subtitle: 'προδίδωμι, προδώσω, προέδωκα, προδέδωκα, προδέδομαι, προεδόθην — betray',
    example: { lemma: 'προδίδωμι', class: 'pp_prodidomi', meaning: 'betray' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'προδίδωμι' },
      'fut.act': { '1sg': 'προδώσω' },
      'aor.act': { '1sg': 'προέδωκα' },
      'perf.act': { '1sg': 'προδέδωκα' },
      'perf.mp': { '1sg': 'προδέδομαι' },
      'aor.pass': { '1sg': 'προεδόθην' }
    },
  },
  pp_pynthanomai: {
    kind: 'verb', label: 'πυνθάνομαι (perceive, ascertain)', literal: true,
    subtitle: 'πυνθάνομαι, πεύσομαι, ἐπυθόμην, πέπυσμαι — perceive, ascertain',
    example: { lemma: 'πυνθάνομαι', class: 'pp_pynthanomai', meaning: 'perceive, ascertain' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'πυνθάνομαι' },
      'fut.act': { '1sg': 'πεύσομαι' },
      'aor.act': { '1sg': 'ἐπυθόμην' },
      'perf.mp': { '1sg': 'πέπυσμαι' }
    },
  },
  pp_poleo: {
    kind: 'verb', label: 'πωλέω (sell)', literal: true,
    subtitle: 'πωλέω, πωλήσω, ἐπώλησα, ἐπωλήθην — sell',
    example: { lemma: 'πωλέω', class: 'pp_poleo', meaning: 'sell' },
    // 'Offer for sale'; the completed sale is ἀπεδόμην/πέπρακα (suppletive set). Aor. act. mostly post-classical, impf. usual.
    categories: ['pres.act', 'fut.act', 'aor.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'πωλέω' },
      'fut.act': { '1sg': 'πωλήσω' },
      'aor.act': { '1sg': 'ἐπώλησα' },
      'aor.pass': { '1sg': 'ἐπωλήθην' }
    },
  },
  pp_rheo: {
    kind: 'verb', label: 'ῥέω (flow)', literal: true,
    subtitle: 'ῥέω, ῥυήσομαι, ἐρρύηκα, ἐρρύην — flow',
    example: { lemma: 'ῥέω', class: 'pp_rheo', meaning: 'flow' },
    categories: ['pres.act', 'fut.act', 'perf.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ῥέω' },
      'fut.act': { '1sg': 'ῥυήσομαι' },
      'perf.act': { '1sg': 'ἐρρύηκα' },
      'aor.pass': { '1sg': 'ἐρρύην' }
    },
  },
  pp_rhegnymi: {
    kind: 'verb', label: 'ῥήγνυμι (break)', literal: true,
    subtitle: 'ῥήγνυμι, ῥήξω, ἔρρηξα, ἐρράγην — break',
    example: { lemma: 'ῥήγνυμι', class: 'pp_rhegnymi', meaning: 'break' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ῥήγνυμι' },
      'fut.act': { '1sg': 'ῥήξω' },
      'aor.act': { '1sg': 'ἔρρηξα' },
      'aor.pass': { '1sg': 'ἐρράγην' }
    },
  },
  pp_rhipto: {
    kind: 'verb', label: 'ῥίπτω (throw)', literal: true,
    subtitle: 'ῥίπτω, ῥίψω, ἔρριψα, ἔρριφα, ἔρριμμαι, ἐρρίφθην — throw',
    example: { lemma: 'ῥίπτω', class: 'pp_rhipto', meaning: 'throw' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ῥίπτω' },
      'fut.act': { '1sg': 'ῥίψω' },
      'aor.act': { '1sg': 'ἔρριψα' },
      'perf.act': { '1sg': 'ἔρριφα' },
      'perf.mp': { '1sg': 'ἔρριμμαι' },
      'aor.pass': { '1sg': ['ἐρρίφθην', 'ἐρρίφην'] }
    },
  },
  pp_sebomai: {
    kind: 'verb', label: 'σέβομαι (worship, honour, venerate)', literal: true,
    subtitle: 'σέβομαι, ἐσέφθην — worship, honour, venerate',
    example: { lemma: 'σέβομαι', class: 'pp_sebomai', meaning: 'worship, honour, venerate' },
    // Present-system verb ('revere'); rare aor. pass. ἐσέφθην 'was awe-struck' (Pl.).
    categories: ['pres.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'σέβομαι' },
      'aor.pass': { '1sg': 'ἐσέφθην' }
    },
  },
  pp_semaino: {
    kind: 'verb', label: 'σημαίνω (show)', literal: true,
    subtitle: 'σημαίνω, σημανῶ, ἐσήμηνα, σεσήμασμαι, ἐσημάνθην — show',
    example: { lemma: 'σημαίνω', class: 'pp_semaino', meaning: 'show' },
    // Liquid stem: Att. aor. ἐσήμηνα (ἐσήμανα X. and later); pf. pass. σεσήμασμαι 'stands sealed' (Hdt., Lys.).
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'σημαίνω' },
      'fut.act': { '1sg': 'σημανῶ' },
      'aor.act': { '1sg': 'ἐσήμηνα' },
      'perf.mp': { '1sg': 'σεσήμασμαι' },
      'aor.pass': { '1sg': 'ἐσημάνθην' }
    },
  },
  pp_stheno: {
    kind: 'verb', label: 'σθένω (be strong)', literal: true,
    subtitle: 'σθένω — be strong',
    example: { lemma: 'σθένω', class: 'pp_stheno', meaning: 'be strong' },
    // Tragic verb, pres./impf. only; prose δύναμαι, ἰσχύω.
    categories: ['pres.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'σθένω' }
    },
  },
  pp_skopeo: {
    kind: 'verb', label: 'σκοπέω (look at)', literal: true,
    subtitle: 'σκοπέω — look at',
    example: { lemma: 'σκοπέω', class: 'pp_skopeo', meaning: 'look at' },
    // Mastronarde's row gives the present only, correctly: Attic supplies the other tenses from σκέπτομαι — fut. σκέψομαι, aor. ἐσκεψάμην, pf. ἔσκεμμαι.
    categories: ['pres.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'σκοπέω' }
    },
  },
  pp_spendo: {
    kind: 'verb', label: 'σπένδω (make a libation; mid. make peace or a truce)', literal: true,
    subtitle: 'σπένδω, σπείσω, ἔσπεισα, ἔσπεισμαι — make a libation; mid. make peace or a truce',
    example: { lemma: 'σπένδω', class: 'pp_spendo', meaning: 'make a libation; mid. make peace or a truce' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'σπένδω' },
      'fut.act': { '1sg': 'σπείσω' },
      'aor.act': { '1sg': 'ἔσπεισα' },
      'perf.mp': { '1sg': 'ἔσπεισμαι' }
    },
  },
  pp_speudo: {
    kind: 'verb', label: 'σπεύδω (hasten)', literal: true,
    subtitle: 'σπεύδω, σπεύσω, ἔσπευσα — hasten',
    example: { lemma: 'σπεύδω', class: 'pp_speudo', meaning: 'hasten' },
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'σπεύδω' },
      'fut.act': { '1sg': 'σπεύσω' },
      'aor.act': { '1sg': 'ἔσπευσα' }
    },
  },
  pp_steicho: {
    kind: 'verb', label: 'στείχω (go)', literal: true,
    subtitle: 'στείχω — go',
    example: { lemma: 'στείχω', class: 'pp_steicho', meaning: 'go' },
    // Poetic 'go, march': pres./impf. in Trag.; aor.2 ἔστιχον epic, never tragic. Prose ἔρχομαι/βαίνω compounds.
    categories: ['pres.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'στείχω' }
    },
  },
  pp_stello: {
    kind: 'verb', label: 'στέλλω (equip, dispatch)', literal: true,
    subtitle: 'στέλλω, στελῶ, ἔστειλα, ἔσταλμαι, ἐστάλην — equip, dispatch',
    example: { lemma: 'στέλλω', class: 'pp_stello', meaning: 'equip, dispatch' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'στέλλω' },
      'fut.act': { '1sg': 'στελῶ' },
      'aor.act': { '1sg': 'ἔστειλα' },
      'perf.mp': { '1sg': 'ἔσταλμαι' },
      'aor.pass': { '1sg': 'ἐστάλην' }
    },
  },
  pp_stenazo: {
    kind: 'verb', label: 'στενάζω (mourn)', literal: true,
    subtitle: 'στενάζω, στενάξω, ἐστέναξα — mourn',
    example: { lemma: 'στενάζω', class: 'pp_stenazo', meaning: 'mourn' },
    // fut. -άξω (Aeschin.); frequentative of στένω.
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'στενάζω' },
      'fut.act': { '1sg': 'στενάξω' },
      'aor.act': { '1sg': 'ἐστέναξα' }
    },
  },
  pp_steno: {
    kind: 'verb', label: 'στένω (mourn)', literal: true,
    subtitle: 'στένω — mourn',
    example: { lemma: 'στένω', class: 'pp_steno', meaning: 'mourn' },
    // Poetic 'groan': pres./impf. only.
    categories: ['pres.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'στένω' }
    },
  },
  pp_sterisko: {
    kind: 'verb', label: 'στερίσκω (deprive of)', literal: true,
    subtitle: 'στερίσκω, στερήσω, ἐστέρησα, ἐστέρηκα, ἐστέρημαι, ἐστερήθην — deprive of',
    example: { lemma: 'στερίσκω', class: 'pp_sterisko', meaning: 'deprive of' },
    // Collateral present of στερέω — tenses from στερε-. Pass. ἐστερήθην 'lost' very common; pres. στέρομαι 'be without'.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'στερίσκω' },
      'fut.act': { '1sg': 'στερήσω' },
      'aor.act': { '1sg': 'ἐστέρησα' },
      'perf.act': { '1sg': 'ἐστέρηκα' },
      'perf.mp': { '1sg': 'ἐστέρημαι' },
      'aor.pass': { '1sg': 'ἐστερήθην' }
    },
  },
  pp_strepho: {
    kind: 'verb', label: 'στρέφω (turn)', literal: true,
    subtitle: 'στρέφω, στρέψω, ἔστρεψα, ἔστραμμαι, ἐστρέφθην — turn',
    example: { lemma: 'στρέφω', class: 'pp_strepho', meaning: 'turn' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'στρέφω' },
      'fut.act': { '1sg': 'στρέψω' },
      'aor.act': { '1sg': 'ἔστρεψα' },
      'perf.mp': { '1sg': 'ἔστραμμαι' },
      'aor.pass': { '1sg': ['ἐστρέφθην', 'ἐστράφην'] }
    },
  },
  pp_stygeo: {
    kind: 'verb', label: 'στυγέω (hate)', literal: true,
    subtitle: 'στυγέω, ἐστύγησα, ἐστυγήθην — hate',
    example: { lemma: 'στυγέω', class: 'pp_stygeo', meaning: 'hate' },
    // Poet./Hdt. 'abhor', never in Attic prose (prose μισέω). Poet. aor.1 ἔστυξα = 'make hateful' (Od.); fut. στυγήσομαι in pass. sense (S.).
    categories: ['pres.act', 'aor.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'στυγέω' },
      'aor.act': { '1sg': 'ἐστύγησα' },
      'aor.pass': { '1sg': 'ἐστυγήθην' }
    },
  },
  pp_syggignosko: {
    kind: 'verb', label: 'συγγιγνώσκω (pardon (+ dat.))', literal: true,
    subtitle: 'συγγιγνώσκω, συγγνώσομαι, συνέγνων, συνέγνωκα, συνέγνωσμαι, συνεγνώσθην — pardon (+ dat.)',
    example: { lemma: 'συγγιγνώσκω', class: 'pp_syggignosko', meaning: 'pardon (+ dat.)' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'συγγιγνώσκω' },
      'fut.act': { '1sg': 'συγγνώσομαι' },
      'aor.act': { '1sg': 'συνέγνων' },
      'perf.act': { '1sg': 'συνέγνωκα' },
      'perf.mp': { '1sg': 'συνέγνωσμαι' },
      'aor.pass': { '1sg': 'συνεγνώσθην' }
    },
  },
  pp_syllego: {
    kind: 'verb', label: 'συλλέγω (collect, gather)', literal: true,
    subtitle: 'συλλέγω, συλλέξω, συνέλεξα, συνείλοχα, συνείλεγμαι, συνελέγην — collect, gather',
    example: { lemma: 'συλλέγω', class: 'pp_syllego', meaning: 'collect, gather' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'συλλέγω' },
      'fut.act': { '1sg': 'συλλέξω' },
      'aor.act': { '1sg': 'συνέλεξα' },
      'perf.act': { '1sg': 'συνείλοχα' },
      'perf.mp': { '1sg': 'συνείλεγμαι' },
      'aor.pass': { '1sg': ['συνελέγην', 'συνελέχθην'] }
    },
  },
  pp_symbaino: {
    kind: 'verb', label: 'συμβαίνω (happen, agree)', literal: true,
    subtitle: 'συμβαίνω, συμβήσομαι, συνέβην, συμβέβηκα, συμβέβαμαι, συνεβάθην — happen, agree',
    example: { lemma: 'συμβαίνω', class: 'pp_symbaino', meaning: 'happen, agree' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'συμβαίνω' },
      'fut.act': { '1sg': 'συμβήσομαι' },
      'aor.act': { '1sg': 'συνέβην' },
      'perf.act': { '1sg': 'συμβέβηκα' },
      'perf.mp': { '1sg': 'συμβέβαμαι' },
      'aor.pass': { '1sg': 'συνεβάθην' }
    },
  },
  pp_symbouleuo: {
    kind: 'verb', label: 'συμβουλεύω (counsel)', literal: true,
    subtitle: 'συμβουλεύω, συμβουλεύσω, συνεβούλευσα, συμβεβούλευκα, συμβεβούλευμαι, συνεβουλεύθην — counsel',
    example: { lemma: 'συμβουλεύω', class: 'pp_symbouleuo', meaning: 'counsel' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'συμβουλεύω' },
      'fut.act': { '1sg': 'συμβουλεύσω' },
      'aor.act': { '1sg': 'συνεβούλευσα' },
      'perf.act': { '1sg': 'συμβεβούλευκα' },
      'perf.mp': { '1sg': 'συμβεβούλευμαι' },
      'aor.pass': { '1sg': 'συνεβουλεύθην' }
    },
  },
  pp_sphazo: {
    kind: 'verb', label: 'σφάζω (kill)', literal: true,
    subtitle: 'σφάζω, σφάξω, ἔσφαξα, ἔσφαγμαι, ἐσφάγην — kill',
    example: { lemma: 'σφάζω', class: 'pp_sphazo', meaning: 'kill' },
    // Attic prose pres. σφάττω. Aor.2 pass. ἐσφάγην standard (ἐσφάχθην rare, not Trag.); fut. pass. σφαγήσομαι E./X.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'σφάζω' },
      'fut.act': { '1sg': 'σφάξω' },
      'aor.act': { '1sg': 'ἔσφαξα' },
      'perf.mp': { '1sg': 'ἔσφαγμαι' },
      'aor.pass': { '1sg': 'ἐσφάγην' }
    },
  },
  pp_sphallo: {
    kind: 'verb', label: 'σφάλλω (overthrow, trip up, baffle)', literal: true,
    subtitle: 'σφάλλω, σφαλῶ, ἔσφηλα, ἔσφαλμαι, ἐσφάλην — overthrow, trip up, baffle',
    example: { lemma: 'σφάλλω', class: 'pp_sphallo', meaning: 'overthrow, trip up, baffle' },
    // Liquid aor. ἔσφηλα; 'fail, be mistaken' = the passive (ἐσφάλην, σφαλήσομαι/σφαλοῦμαι).
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'σφάλλω' },
      'fut.act': { '1sg': 'σφαλῶ' },
      'aor.act': { '1sg': 'ἔσφηλα' },
      'perf.mp': { '1sg': 'ἔσφαλμαι' },
      'aor.pass': { '1sg': 'ἐσφάλην' }
    },
  },
  pp_sozo: {
    kind: 'verb', label: 'σῴζω (save)', literal: true,
    subtitle: 'σῴζω, σώσω, ἔσωσα, σέσωκα, σέσωμαι, ἐσώθην — save',
    example: { lemma: 'σῴζω', class: 'pp_sozo', meaning: 'save' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'σῴζω' },
      'fut.act': { '1sg': ['σώσω', 'σῴσω'] },
      'aor.act': { '1sg': ['ἔσωσα', 'ἔσῳσα'] },
      'perf.act': { '1sg': 'σέσωκα' },
      'perf.mp': { '1sg': ['σέσωμαι', 'σέσῳσμαι'] },
      'aor.pass': { '1sg': 'ἐσώθην' }
    },
  },
  pp_taratto: {
    kind: 'verb', label: 'ταράττω (confuse, confound, throw into disarray)', literal: true,
    subtitle: 'ταράττω, ταράξω, ἐτάραξα, τετάραγμαι, ἐταράχθην — confuse, confound, throw into disarray',
    example: { lemma: 'ταράττω', class: 'pp_taratto', meaning: 'confuse, confound, throw into disarray' },
    // No classical perfect active (Ep. intr. τέτρηχα 'be in turmoil'). The deck row now carries ταράσσω as well.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ταράττω' },
      'fut.act': { '1sg': 'ταράξω' },
      'aor.act': { '1sg': 'ἐτάραξα' },
      'perf.mp': { '1sg': 'τετάραγμαι' },
      'aor.pass': { '1sg': 'ἐταράχθην' }
    },
  },
  pp_tatto: {
    kind: 'verb', label: 'τάττω (arrange, order)', literal: true,
    subtitle: 'τάττω, τάξω, ἔταξα, τέταχα, τέταγμαι, ἐτάχθην — arrange, order',
    example: { lemma: 'τάττω', class: 'pp_tatto', meaning: 'arrange, order' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'τάττω' },
      'fut.act': { '1sg': 'τάξω' },
      'aor.act': { '1sg': 'ἔταξα' },
      'perf.act': { '1sg': 'τέταχα' },
      'perf.mp': { '1sg': 'τέταγμαι' },
      'aor.pass': { '1sg': 'ἐτάχθην' }
    },
  },
  pp_teichizo: {
    kind: 'verb', label: 'τειχίζω (fortify)', literal: true,
    subtitle: 'τειχίζω, τειχιῶ, ἐτείχισα, τετείχικα, τετείχισμαι, ἐτειχίσθην — fortify',
    example: { lemma: 'τειχίζω', class: 'pp_teichizo', meaning: 'fortify' },
    // All six classical (pf. τετείχικα D. 19.112); mid. ἐτειχισάμην 'built for themselves' (Il., Th.).
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'τειχίζω' },
      'fut.act': { '1sg': 'τειχιῶ' },
      'aor.act': { '1sg': 'ἐτείχισα' },
      'perf.act': { '1sg': 'τετείχικα' },
      'perf.mp': { '1sg': 'τετείχισμαι' },
      'aor.pass': { '1sg': 'ἐτειχίσθην' }
    },
  },
  pp_teleutao: {
    kind: 'verb', label: 'τελευτάω (accomplish, end, die)', literal: true,
    subtitle: 'τελευτάω, τελευτήσω, ἐτελεύτησα, τετελεύτηκα, τετελεύτημαι, ἐτελευτήθην — accomplish, end, die',
    example: { lemma: 'τελευτάω', class: 'pp_teleutao', meaning: 'accomplish, end, die' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'τελευτάω' },
      'fut.act': { '1sg': 'τελευτήσω' },
      'aor.act': { '1sg': 'ἐτελεύτησα' },
      'perf.act': { '1sg': 'τετελεύτηκα' },
      'perf.mp': { '1sg': 'τετελεύτημαι' },
      'aor.pass': { '1sg': 'ἐτελευτήθην' }
    },
  },
  pp_temno: {
    kind: 'verb', label: 'τέμνω (cut)', literal: true,
    subtitle: 'τέμνω, τεμῶ, ἔτεμον, τέτμημαι, ἐτμήθην — cut',
    example: { lemma: 'τέμνω', class: 'pp_temno', meaning: 'cut' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'τέμνω' },
      'fut.act': { '1sg': 'τεμῶ' },
      'aor.act': { '1sg': ['ἔτεμον', 'ἔταμον'] },
      'perf.mp': { '1sg': 'τέτμημαι' },
      'aor.pass': { '1sg': 'ἐτμήθην' }
    },
  },
  pp_tereo: {
    kind: 'verb', label: 'τηρέω (watch (for))', literal: true,
    subtitle: 'τηρέω, τηρήσω, ἐτήρησα, τετήρηκα, τετήρημαι, ἐτηρήθην — watch (for)',
    example: { lemma: 'τηρέω', class: 'pp_tereo', meaning: 'watch (for)' },
    // Regular -έω; fut. mid. τηρήσομαι in pass. sense (Th. 4.30).
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'τηρέω' },
      'fut.act': { '1sg': 'τηρήσω' },
      'aor.act': { '1sg': 'ἐτήρησα' },
      'perf.act': { '1sg': 'τετήρηκα' },
      'perf.mp': { '1sg': 'τετήρημαι' },
      'aor.pass': { '1sg': 'ἐτηρήθην' }
    },
  },
  pp_tikto: {
    kind: 'verb', label: 'τίκτω (beget)', literal: true,
    subtitle: 'τίκτω, τέξομαι, ἔτεκον, τέτοκα, τέτεγμαι, ἐτέχθην — beget',
    example: { lemma: 'τίκτω', class: 'pp_tikto', meaning: 'beget' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'τίκτω' },
      'fut.act': { '1sg': 'τέξομαι' },
      'aor.act': { '1sg': ['ἔτεκον', 'ἔτεξα'] },
      'perf.act': { '1sg': 'τέτοκα' },
      'perf.mp': { '1sg': 'τέτεγμαι' },
      'aor.pass': { '1sg': 'ἐτέχθην' }
    },
  },
  pp_timoreo: {
    kind: 'verb', label: 'τιμωρέω (avenge, punish)', literal: true,
    subtitle: 'τιμωρέω, τιμωρήσω, ἐτιμώρησα, τετιμώρημαι, ἐτιμωρήθην — avenge, punish',
    example: { lemma: 'τιμωρέω', class: 'pp_timoreo', meaning: 'avenge, punish' },
    // Act. 'avenge (τινι)'; mid. τιμωρήσομαι/ἐτιμωρησάμην 'take vengeance on, punish (τινα)'; pf. τετιμώρημαι in both mid. and pass. sense; pass. 'be punished' (Pl.).
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'τιμωρέω' },
      'fut.act': { '1sg': 'τιμωρήσω' },
      'aor.act': { '1sg': 'ἐτιμώρησα' },
      'perf.mp': { '1sg': 'τετιμώρημαι' },
      'aor.pass': { '1sg': 'ἐτιμωρήθην' }
    },
  },
  pp_titrosko: {
    kind: 'verb', label: 'τιτρώσκω (wound)', literal: true,
    subtitle: 'τιτρώσκω, τρώσω, ἔτρωσα, τέτρωμαι, ἐτρώθην — wound',
    example: { lemma: 'τιτρώσκω', class: 'pp_titrosko', meaning: 'wound' },
    // τρω- tenses; fut. pass. τρωθήσομαι Pl. No classical pf. act.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'τιτρώσκω' },
      'fut.act': { '1sg': 'τρώσω' },
      'aor.act': { '1sg': 'ἔτρωσα' },
      'perf.mp': { '1sg': 'τέτρωμαι' },
      'aor.pass': { '1sg': 'ἐτρώθην' }
    },
  },
  pp_tolmao: {
    kind: 'verb', label: 'τολμάω (dare)', literal: true,
    subtitle: 'τολμάω, τολμήσω, ἐτόλμησα, τετόλμηκα — dare',
    example: { lemma: 'τολμάω', class: 'pp_tolmao', meaning: 'dare' },
    // Regular ᾱ→η contract; pf. τετόλμηκα already A./Pi.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'τολμάω' },
      'fut.act': { '1sg': 'τολμήσω' },
      'aor.act': { '1sg': 'ἐτόλμησα' },
      'perf.act': { '1sg': 'τετόλμηκα' }
    },
  },
  pp_trepo: {
    kind: 'verb', label: 'τρέπω (turn)', literal: true,
    subtitle: 'τρέπω, τρέψω, ἔτρεψα, τέτροφα, τέτραμμαι, ἐτρέφθην — turn',
    example: { lemma: 'τρέπω', class: 'pp_trepo', meaning: 'turn' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'τρέπω' },
      'fut.act': { '1sg': 'τρέψω' },
      'aor.act': { '1sg': ['ἔτρεψα', 'ἔτραπον'] },
      'perf.act': { '1sg': 'τέτροφα' },
      'perf.mp': { '1sg': 'τέτραμμαι' },
      'aor.pass': { '1sg': ['ἐτρέφθην', 'ἐτράπην'] }
    },
  },
  pp_trepho: {
    kind: 'verb', label: 'τρέφω (nourish)', literal: true,
    subtitle: 'τρέφω, θρέψω, ἔθρεψα, τέτροφα, τέθραμμαι, ἐτράφην — nourish',
    example: { lemma: 'τρέφω', class: 'pp_trepho', meaning: 'nourish' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'τρέφω' },
      'fut.act': { '1sg': 'θρέψω' },
      'aor.act': { '1sg': 'ἔθρεψα' },
      'perf.act': { '1sg': 'τέτροφα' },
      'perf.mp': { '1sg': 'τέθραμμαι' },
      'aor.pass': { '1sg': ['ἐτράφην', 'ἐτρέφθην'] }
    },
  },
  pp_trecho: {
    kind: 'verb', label: 'τρέχω (run)', literal: true,
    subtitle: 'τρέχω, δραμοῦμαι, ἔδραμον — run',
    example: { lemma: 'τρέχω', class: 'pp_trecho', meaning: 'run' },
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'τρέχω' },
      'fut.act': { '1sg': ['δραμοῦμαι', 'θρέξομαι'] },
      'aor.act': { '1sg': 'ἔδραμον' }
    },
  },
  pp_tygchano: {
    kind: 'verb', label: 'τυγχάνω (happen, meet with (+ gen.))', literal: true,
    subtitle: 'τυγχάνω, τεύξομαι, ἔτυχον, τετύχηκα — happen, meet with (+ gen.)',
    example: { lemma: 'τυγχάνω', class: 'pp_tygchano', meaning: 'happen, meet with (+ gen.)' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'τυγχάνω' },
      'fut.act': { '1sg': 'τεύξομαι' },
      'aor.act': { '1sg': 'ἔτυχον' },
      'perf.act': { '1sg': 'τετύχηκα' }
    },
  },
  pp_typto: {
    kind: 'verb', label: 'τύπτω (strike)', literal: true,
    subtitle: 'τύπτω, τυπτήσω — strike',
    example: { lemma: 'τύπτω', class: 'pp_typto', meaning: 'strike' },
    // Suppletive in Attic: fut. τυπτήσω (Ar., Pl., D.), but 'struck' = ἐπάταξα (πατάσσω), 'was struck' = ἐπλήγην, pf. πέπληγμαι (πλήττω). The τυπ- aorists (ἔτυψα, ἐτύπην, τέτυμμαι) are poetic/Ionic.
    categories: ['pres.act', 'fut.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'τύπτω' },
      'fut.act': { '1sg': 'τυπτήσω' }
    },
  },
  pp_hybrizo: {
    kind: 'verb', label: 'ὑβρίζω (insult)', literal: true,
    subtitle: 'ὑβρίζω, ὑβριῶ, ὕβρισα, ὕβρικα, ὕβρισμαι, ὑβρίσθην — insult',
    example: { lemma: 'ὑβρίζω', class: 'pp_hybrizo', meaning: 'insult' },
    // All six classical (pf. ὕβρικα Ar., D.); augment invisible on ὑ-.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ὑβρίζω' },
      'fut.act': { '1sg': 'ὑβριῶ' },
      'aor.act': { '1sg': 'ὕβρισα' },
      'perf.act': { '1sg': 'ὕβρικα' },
      'perf.mp': { '1sg': 'ὕβρισμαι' },
      'aor.pass': { '1sg': 'ὑβρίσθην' }
    },
  },
  pp_hypereteo: {
    kind: 'verb', label: 'ὑπηρετέω (serve)', literal: true,
    subtitle: 'ὑπηρετέω, ὑπηρετήσω, ὑπηρέτησα, ὑπηρέτηκα — serve',
    example: { lemma: 'ὑπηρετέω', class: 'pp_hypereteo', meaning: 'serve' },
    // Regular -έω (+dat.); plpf. ὑπηρετήκειν X. Denominative — augment leaves spelling unchanged.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ὑπηρετέω' },
      'fut.act': { '1sg': 'ὑπηρετήσω' },
      'aor.act': { '1sg': 'ὑπηρέτησα' },
      'perf.act': { '1sg': 'ὑπηρέτηκα' }
    },
  },
  pp_hypischneomai: {
    kind: 'verb', label: 'ὑπισχνέομαι (promise)', literal: true,
    subtitle: 'ὑπισχνέομαι, ὑποσχήσομαι, ὑπεσχόμην, ὑπέσχημαι — promise',
    example: { lemma: 'ὑπισχνέομαι', class: 'pp_hypischneomai', meaning: 'promise' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ὑπισχνέομαι' },
      'fut.act': { '1sg': 'ὑποσχήσομαι' },
      'aor.act': { '1sg': 'ὑπεσχόμην' },
      'perf.mp': { '1sg': 'ὑπέσχημαι' }
    },
  },
  pp_hypopteuo: {
    kind: 'verb', label: 'ὑποπτεύω (suspect)', literal: true,
    subtitle: 'ὑποπτεύω, ὑποπτεύσω, ὑπώπτευσα, ὑπωπτεύθην — suspect',
    example: { lemma: 'ὑποπτεύω', class: 'pp_hypopteuo', meaning: 'suspect' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ὑποπτεύω' },
      'fut.act': { '1sg': 'ὑποπτεύσω' },
      'aor.act': { '1sg': 'ὑπώπτευσα' },
      'aor.pass': { '1sg': 'ὑπωπτεύθην' }
    },
  },
  pp_phaino: {
    kind: 'verb', label: 'φαίνω (show; pass. appear)', literal: true,
    subtitle: 'φαίνω, φανῶ, ἔφηνα, πέφηνα, πέφασμαι, ἐφάνην — show; pass. appear',
    example: { lemma: 'φαίνω', class: 'pp_phaino', meaning: 'show; pass. appear' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'φαίνω' },
      'fut.act': { '1sg': 'φανῶ' },
      'aor.act': { '1sg': 'ἔφηνα' },
      'perf.act': { '1sg': 'πέφηνα' },
      'perf.mp': { '1sg': 'πέφασμαι' },
      'aor.pass': { '1sg': ['ἐφάνην', 'ἐφάνθην'] }
    },
  },
  pp_pheidomai: {
    kind: 'verb', label: 'φείδομαι (spare (+ gen.))', literal: true,
    subtitle: 'φείδομαι, φείσομαι, ἐφεισάμην — spare (+ gen.)',
    example: { lemma: 'φείδομαι', class: 'pp_pheidomai', meaning: 'spare (+ gen.)' },
    // Deponent (+gen.); Ep. redupl. aor. πεφιδέσθαι.
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'φείδομαι' },
      'fut.act': { '1sg': 'φείσομαι' },
      'aor.act': { '1sg': 'ἐφεισάμην' }
    },
  },
  pp_phero: {
    kind: 'verb', label: 'φέρω (bear, carry)', literal: true,
    subtitle: 'φέρω, οἴσω, ἤνεγκον, ἐνήνοχα, ἐνήνεγμαι, ἠνέχθην — bear, carry',
    example: { lemma: 'φέρω', class: 'pp_phero', meaning: 'bear, carry' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'φέρω' },
      'fut.act': { '1sg': 'οἴσω' },
      'aor.act': { '1sg': ['ἤνεγκον', 'ἤνεγκα'] },
      'perf.act': { '1sg': 'ἐνήνοχα' },
      'perf.mp': { '1sg': 'ἐνήνεγμαι' },
      'aor.pass': { '1sg': 'ἠνέχθην' }
    },
  },
  pp_pheugo: {
    kind: 'verb', label: 'φεύγω (flee)', literal: true,
    subtitle: 'φεύγω, φεύξομαι, ἔφυγον, πέφευγα — flee',
    example: { lemma: 'φεύγω', class: 'pp_pheugo', meaning: 'flee' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'φεύγω' },
      'fut.act': { '1sg': ['φεύξομαι', 'φευξέομαι'] },
      'aor.act': { '1sg': 'ἔφυγον' },
      'perf.act': { '1sg': 'πέφευγα' }
    },
  },
  pp_phthano: {
    kind: 'verb', label: 'φθάνω (anticipate)', literal: true,
    subtitle: 'φθάνω, φθήσομαι, ἔφθασα — anticipate',
    example: { lemma: 'φθάνω', class: 'pp_phthano', meaning: 'anticipate' },
    categories: ['pres.act', 'fut.act', 'aor.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'φθάνω' },
      'fut.act': { '1sg': 'φθήσομαι' },
      'aor.act': { '1sg': ['ἔφθασα', 'ἔφθην'] }
    },
  },
  pp_phtheggomai: {
    kind: 'verb', label: 'φθέγγομαι (utter)', literal: true,
    subtitle: 'φθέγγομαι, φθέγξομαι, ἐφθεγξάμην, ἔφθεγμαι — utter',
    example: { lemma: 'φθέγγομαι', class: 'pp_phtheggomai', meaning: 'utter' },
    // Deponent; pf. ἔφθεγμαι Pl.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'φθέγγομαι' },
      'fut.act': { '1sg': 'φθέγξομαι' },
      'aor.act': { '1sg': 'ἐφθεγξάμην' },
      'perf.mp': { '1sg': 'ἔφθεγμαι' }
    },
  },
  pp_phthino: {
    kind: 'verb', label: 'φθίνω (waste, destroy)', literal: true,
    subtitle: 'φθίνω — waste, destroy',
    example: { lemma: 'φθίνω', class: 'pp_phthino', meaning: 'waste, destroy' },
    // Poetic 'waste away, wane' (LSJ lemmatizes φθίω); the trans. φθίσω/ἔφθισα and mid. ἐφθίμην are Epic. Prose: φθίνοντος τοῦ μηνός.
    categories: ['pres.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'φθίνω' }
    },
  },
  pp_phthoneo: {
    kind: 'verb', label: 'φθονέω (envy, grudge)', literal: true,
    subtitle: 'φθονέω, φθονήσω, ἐφθόνησα, ἐφθονήθην — envy, grudge',
    example: { lemma: 'φθονέω', class: 'pp_phthoneo', meaning: 'envy, grudge' },
    // Regular -έω (+dat.); 'be envied' has fut. φθονήσομαι in pass. sense (D. 47.70) beside φθονηθήσομαι (X.).
    categories: ['pres.act', 'fut.act', 'aor.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'φθονέω' },
      'fut.act': { '1sg': 'φθονήσω' },
      'aor.act': { '1sg': 'ἐφθόνησα' },
      'aor.pass': { '1sg': 'ἐφθονήθην' }
    },
  },
  pp_phileo: {
    kind: 'verb', label: 'φιλέω (love)', literal: true,
    subtitle: 'φιλέω, φιλήσω, ἐφίλησα, πεφίληκα, πεφίλημαι, ἐφιλήθην — love',
    example: { lemma: 'φιλέω', class: 'pp_phileo', meaning: 'love' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'φιλέω' },
      'fut.act': { '1sg': 'φιλήσω' },
      'aor.act': { '1sg': 'ἐφίλησα' },
      'perf.act': { '1sg': 'πεφίληκα' },
      'perf.mp': { '1sg': 'πεφίλημαι' },
      'aor.pass': { '1sg': 'ἐφιλήθην' }
    },
  },
  pp_phobeomai: {
    kind: 'verb', label: 'φοβέομαι (be afraid)', literal: true,
    subtitle: 'φοβέομαι, φοβήσομαι, πεφόβημαι, ἐφοβήθην — be afraid',
    example: { lemma: 'φοβέομαι', class: 'pp_phobeomai', meaning: 'be afraid' },
    // Passive deponent: 'feared' = ἐφοβήθην, never *ἐφοβησάμην. Act. φοβέω 'frighten' (ἐφόβησα). fut. also φοβηθήσομαι.
    categories: ['pres.act', 'fut.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'φοβέομαι' },
      'fut.act': { '1sg': 'φοβήσομαι' },
      'perf.mp': { '1sg': 'πεφόβημαι' },
      'aor.pass': { '1sg': 'ἐφοβήθην' }
    },
  },
  pp_phoneuo: {
    kind: 'verb', label: 'φονεύω (slaughter)', literal: true,
    subtitle: 'φονεύω, φονεύσω, ἐφόνευσα, ἐφονεύθην — slaughter',
    example: { lemma: 'φονεύω', class: 'pp_phoneuo', meaning: 'slaughter' },
    // Regular -εύω; pass. 'be slain' Th. 8.95. Prose often prefers ἀποκτείνω.
    categories: ['pres.act', 'fut.act', 'aor.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'φονεύω' },
      'fut.act': { '1sg': 'φονεύσω' },
      'aor.act': { '1sg': 'ἐφόνευσα' },
      'aor.pass': { '1sg': 'ἐφονεύθην' }
    },
  },
  pp_phrazo: {
    kind: 'verb', label: 'φράζω (tell)', literal: true,
    subtitle: 'φράζω, φράσω, ἔφρασα, πέφρακα, πέφρασμαι, ἐφράσθην — tell',
    example: { lemma: 'φράζω', class: 'pp_phrazo', meaning: 'tell' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'φράζω' },
      'fut.act': { '1sg': 'φράσω' },
      'aor.act': { '1sg': 'ἔφρασα' },
      'perf.act': { '1sg': 'πέφρακα' },
      'perf.mp': { '1sg': 'πέφρασμαι' },
      'aor.pass': { '1sg': 'ἐφράσθην' }
    },
  },
  pp_phroneo: {
    kind: 'verb', label: 'φρονέω (think, intend)', literal: true,
    subtitle: 'φρονέω, φρονήσω, ἐφρόνησα, πεφρόνηκα — think, intend',
    example: { lemma: 'φρονέω', class: 'pp_phroneo', meaning: 'think, intend' },
    // Regular -έω; pf. πεφρόνηκα Isoc. (μέγα φρονεῖν 'be proud').
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'φρονέω' },
      'fut.act': { '1sg': 'φρονήσω' },
      'aor.act': { '1sg': 'ἐφρόνησα' },
      'perf.act': { '1sg': 'πεφρόνηκα' }
    },
  },
  pp_phroureo: {
    kind: 'verb', label: 'φρουρέω (guard)', literal: true,
    subtitle: 'φρουρέω, φρουρήσω, ἐφρούρησα, πεφρούρημαι, ἐφρουρήθην — guard',
    example: { lemma: 'φρουρέω', class: 'pp_phroureo', meaning: 'guard' },
    // Regular -έω; fut. mid. φρουρήσομαι in pass. sense (E.).
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'φρουρέω' },
      'fut.act': { '1sg': 'φρουρήσω' },
      'aor.act': { '1sg': 'ἐφρούρησα' },
      'perf.mp': { '1sg': 'πεφρούρημαι' },
      'aor.pass': { '1sg': 'ἐφρουρήθην' }
    },
  },
  pp_phylatto: {
    kind: 'verb', label: 'φυλάττω (guard)', literal: true,
    subtitle: 'φυλάττω, φυλάξω, ἐφύλαξα, πεφύλαχα, πεφύλαγμαι, ἐφυλάχθην — guard',
    example: { lemma: 'φυλάττω', class: 'pp_phylatto', meaning: 'guard' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'φυλάττω' },
      'fut.act': { '1sg': 'φυλάξω' },
      'aor.act': { '1sg': 'ἐφύλαξα' },
      'perf.act': { '1sg': 'πεφύλαχα' },
      'perf.mp': { '1sg': 'πεφύλαγμαι' },
      'aor.pass': { '1sg': 'ἐφυλάχθην' }
    },
  },
  pp_phyo: {
    kind: 'verb', label: 'φύω (beget)', literal: true,
    subtitle: 'φύω, φύσω, ἔφυσα, πέφυκα — beget',
    example: { lemma: 'φύω', class: 'pp_phyo', meaning: 'beget' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'φύω' },
      'fut.act': { '1sg': 'φύσω' },
      'aor.act': { '1sg': ['ἔφυσα', 'ἔφυν'] },
      'perf.act': { '1sg': 'πέφυκα' }
    },
  },
  pp_chairo: {
    kind: 'verb', label: 'χαίρω (rejoice)', literal: true,
    subtitle: 'χαίρω, χαιρήσω, κεχάρηκα, ἐχάρην — rejoice',
    example: { lemma: 'χαίρω', class: 'pp_chairo', meaning: 'rejoice' },
    categories: ['pres.act', 'fut.act', 'perf.act', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'χαίρω' },
      'fut.act': { '1sg': 'χαιρήσω' },
      'perf.act': { '1sg': 'κεχάρηκα' },
      'aor.pass': { '1sg': 'ἐχάρην' }
    },
  },
  pp_chraomai: {
    kind: 'verb', label: 'χράομαι (use (+ dat.))', literal: true,
    subtitle: 'χράομαι, χρήσομαι, ἐχρησάμην, κέχρημαι, ἐχρήσθην — use (+ dat.)',
    example: { lemma: 'χράομαι', class: 'pp_chraomai', meaning: 'use (+ dat.)' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'χράομαι' },
      'fut.act': { '1sg': 'χρήσομαι' },
      'aor.act': { '1sg': 'ἐχρησάμην' },
      'perf.mp': { '1sg': 'κέχρημαι' },
      'aor.pass': { '1sg': 'ἐχρήσθην' }
    },
  },
  pp_chre: {
    kind: 'verb', label: 'χρή (it is necessary)', literal: true,
    subtitle: 'χρή, χρἤσται — it is necessary',
    example: { lemma: 'χρή', class: 'pp_chre', meaning: 'it is necessary' },
    categories: ['pres.act', 'fut.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'χρή' },
      'fut.act': { '1sg': 'χρἤσται' }
    },
  },
  pp_chrezo: {
    kind: 'verb', label: 'χρῄζω (long for)', literal: true,
    subtitle: 'χρῄζω — long for',
    example: { lemma: 'χρῄζω', class: 'pp_chrezo', meaning: 'long for' },
    // In Attic only pres./impf. ('want, need', +gen.); fut./aor. (χρηΐσω, ἐχρήϊσα) are Ionic. Prose otherwise δέομαι.
    categories: ['pres.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'χρῄζω' }
    },
  },
  pp_choreo: {
    kind: 'verb', label: 'χωρέω (go)', literal: true,
    subtitle: 'χωρέω, χωρήσομαι, ἐχώρησα, κεχώρηκα — go',
    example: { lemma: 'χωρέω', class: 'pp_choreo', meaning: 'go' },
    // In Attic the future is middle χωρήσομαι (χωρήσω act. only Th. 1.82 and in compounds); pf. κεχώρηκα 'has gone/spread' (Hdt., Th.).
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'χωρέω' },
      'fut.act': { '1sg': 'χωρήσομαι' },
      'aor.act': { '1sg': 'ἐχώρησα' },
      'perf.act': { '1sg': 'κεχώρηκα' }
    },
  },
  pp_pseudo: {
    kind: 'verb', label: 'ψεύδω (deceive; pass. lie)', literal: true,
    subtitle: 'ψεύδω, ψεύσω, ἔψευσα, ἔψευσμαι, ἐψεύσθην — deceive; pass. lie',
    example: { lemma: 'ψεύδω', class: 'pp_pseudo', meaning: 'deceive; pass. lie' },
    // Act. 'deceive, cheat of'; mid. ψεύδομαι 'lie' (ψεύσομαι, ἐψευσάμην); ἐψεύσθην 'was deceived, was mistaken (+gen.)'; pf. ἔψευσμαι in both senses. OCR lists ψεύδομαι as its own entry.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ψεύδω' },
      'fut.act': { '1sg': 'ψεύσω' },
      'aor.act': { '1sg': 'ἔψευσα' },
      'perf.mp': { '1sg': 'ἔψευσμαι' },
      'aor.pass': { '1sg': 'ἐψεύσθην' }
    },
  },
  pp_psephizo: {
    kind: 'verb', label: 'ψηφίζω (vote)', literal: true,
    subtitle: 'ψηφίζω, ψηφιοῦμαι, ἐψηφισάμην, ἐψήφισμαι, ἐψηφίσθην — vote',
    example: { lemma: 'ψηφίζω', class: 'pp_psephizo', meaning: 'vote' },
    // The live verb is mid. ψηφίζομαι 'vote' (Att. fut. ψηφιοῦμαι; pf. ἐψήφισμαι med. sense); pass. of decrees τὰ ψηφισθέντα. Act. = 'count'.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ψηφίζω' },
      'fut.act': { '1sg': 'ψηφιοῦμαι' },
      'aor.act': { '1sg': 'ἐψηφισάμην' },
      'perf.mp': { '1sg': 'ἐψήφισμαι' },
      'aor.pass': { '1sg': 'ἐψηφίσθην' }
    },
  },
  pp_otheo: {
    kind: 'verb', label: 'ὠθέω (push)', literal: true,
    subtitle: 'ὠθέω, ὤσω, ἔωσα, ἔωσμαι, ἐώσθην — push',
    example: { lemma: 'ὠθέω', class: 'pp_otheo', meaning: 'push' },
    // Irregular augment ἐω- (impf. ἐώθουν); Attic fut. ὤσω (ὠθήσω poet.); mid. ἐωσάμην 'repulsed' (Th.).
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ὠθέω' },
      'fut.act': { '1sg': 'ὤσω' },
      'aor.act': { '1sg': 'ἔωσα' },
      'perf.mp': { '1sg': 'ἔωσμαι' },
      'aor.pass': { '1sg': 'ἐώσθην' }
    },
  },
  pp_oneomai: {
    kind: 'verb', label: 'ὠνέομαι (buy)', literal: true,
    subtitle: 'ὠνέομαι, ὠνήσομαι, ἐπριάμην, ἐώνημαι, ἐωνήθην — buy',
    example: { lemma: 'ὠνέομαι', class: 'pp_oneomai', meaning: 'buy' },
    // Suppletive: Attic aorist is ἐπριάμην (ὠνησάμην not Attic before i BC); impf. ἐωνούμην; pf. ἐώνημαι act. sense 'have bought' and pass.; ἐωνήθην 'was bought'. Buy-side of the πωλέω/ἀποδίδομαι/πιπράσκω set.
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ὠνέομαι' },
      'fut.act': { '1sg': 'ὠνήσομαι' },
      'aor.act': { '1sg': 'ἐπριάμην' },
      'perf.mp': { '1sg': 'ἐώνημαι' },
      'aor.pass': { '1sg': 'ἐωνήθην' }
    },
  },
  pp_opheleo: {
    kind: 'verb', label: 'ὠφελέω (benefit, help)', literal: true,
    subtitle: 'ὠφελέω, ὠφελήσω, ὠφέλησα, ὠφέληκα, ὠφέλημαι, ὠφελήθην — benefit, help',
    example: { lemma: 'ὠφελέω', class: 'pp_opheleo', meaning: 'benefit, help' },
    categories: ['pres.act', 'fut.act', 'aor.act', 'perf.act', 'perf.mp', 'aor.pass'],
    cellKeys: ['1sg'],
    endings: {
      'pres.act': { '1sg': 'ὠφελέω' },
      'fut.act': { '1sg': 'ὠφελήσω' },
      'aor.act': { '1sg': 'ὠφέλησα' },
      'perf.act': { '1sg': 'ὠφέληκα' },
      'perf.mp': { '1sg': 'ὠφέλημαι' },
      'aor.pass': { '1sg': 'ὠφελήθην' }
    },
  },
};

const GREEK_CATEGORY_LABELS = {
  nom:'Nominative', voc:'Vocative', acc:'Accusative', gen:'Genitive', dat:'Dative',
  // degree, not case: the two rows every adjective table in the appendix
  // carries under its paradigm (pp.327-329)
  comp:'Comparative', sup:'Superlative',
  // indicative
  'pres.act':'Present Active',
  'pres.mp':'Present Middle/Passive',
  'impf.act':'Imperfect Active',
  'impf.mid':'Imperfect Middle',
  'impf.mp':'Imperfect Middle/Passive',
  'fut.act':'Future Active',
  'fut.mid':'Future Middle',
  'fut.pass':'Future Passive',
  'aor.act':'Aorist Active',
  'aor.mid':'Aorist Middle',
  'aor.pass':'Aorist Passive',
  'perf.act':'Perfect Active',
  'perf.mp':'Perfect Middle/Passive',
  'plup.act':'Pluperfect Active',
  'plup.mp':'Pluperfect Middle/Passive',
  'futperf.act':'Future Perfect Active',
  'futperf.mp':'Future Perfect Middle/Passive',
  // subjunctive, optative and imperative
  'pres.act.subj':'Present Active Subjunctive',
  'pres.act.opt':'Present Active Optative',
  'pres.act.imper':'Present Active Imperative',
  'pres.mp.subj':'Present Middle/Passive Subjunctive',
  'pres.mp.opt':'Present Middle/Passive Optative',
  'pres.mp.imper':'Present Middle/Passive Imperative',
  'fut.act.opt':'Future Active Optative',
  'fut.mid.opt':'Future Middle Optative',
  'fut.pass.opt':'Future Passive Optative',
  'aor.act.subj':'Aorist Active Subjunctive',
  'aor.act.opt':'Aorist Active Optative',
  'aor.act.imper':'Aorist Active Imperative',
  'aor.mid.subj':'Aorist Middle Subjunctive',
  'aor.mid.opt':'Aorist Middle Optative',
  'aor.mid.imper':'Aorist Middle Imperative',
  'aor.pass.subj':'Aorist Passive Subjunctive',
  'aor.pass.opt':'Aorist Passive Optative',
  'aor.pass.imper':'Aorist Passive Imperative',
  'perf.act.subj':'Perfect Active Subjunctive',
  'perf.act.opt':'Perfect Active Optative',
  'perf.act.imper':'Perfect Active Imperative',
  'perf.mp.subj':'Perfect Middle/Passive Subjunctive',
  'perf.mp.opt':'Perfect Middle/Passive Optative',
  'perf.mp.imper':'Perfect Middle/Passive Imperative',
  'futperf.act.opt':'Future Perfect Active Optative',
  'futperf.mp.opt':'Future Perfect Middle/Passive Optative',
  // infinitives
  'pres.act.inf':'Present Active Infinitive',
  'pres.mp.inf':'Present Middle/Passive Infinitive',
  'fut.act.inf':'Future Active Infinitive',
  'fut.mid.inf':'Future Middle Infinitive',
  'fut.pass.inf':'Future Passive Infinitive',
  'aor.act.inf':'Aorist Active Infinitive',
  'aor.mid.inf':'Aorist Middle Infinitive',
  'aor.pass.inf':'Aorist Passive Infinitive',
  'perf.act.inf':'Perfect Active Infinitive',
  'perf.mp.inf':'Perfect Middle/Passive Infinitive',
  'futperf.act.inf':'Future Perfect Active Infinitive',
  'futperf.mp.inf':'Future Perfect Middle/Passive Infinitive'
};

const GREEK_CELL_LABELS = {
  sg:'Singular', pl:'Plural',
  'm.sg':'Masculine Singular', 'f.sg':'Feminine Singular', 'n.sg':'Neuter Singular',
  'm.pl':'Masculine Plural',   'f.pl':'Feminine Plural',   'n.pl':'Neuter Plural',
  // two-termination adjectives share one masculine/feminine column
  'mf.sg':'Masc./Fem. Singular', 'mf.pl':'Masc./Fem. Plural',
  // neither the infinitive nor a citation form has a person or number
  inf:'—', cit:'—',
  '1sg':'1st sg.', '2sg':'2nd sg.', '3sg':'3rd sg.',
  '1pl':'1st pl.', '2pl':'2nd pl.', '3pl':'3rd pl.'
};
