/* ======================================================================
   Cotidie — Latin starter vocabulary

   Deliberately regular-only (see HANDOFF.md §4): every entry here inflects
   by mechanically applying its class's endings (data/latin-paradigms.js)
   with no further irregularity. Verbs with irregular perfect stems (e.g.
   videō -> vīdī, veniō -> vēnī) are still included where their PRESENT
   SYSTEM is fully regular, since v1 only drills the present system.
   Excluded deliberately: dō/dare (irregular short-a throughout), gaudeō
   (semi-deponent), -ius/-ium 2nd-declension nouns, -er 2nd-declension
   nouns (puer, ager), 3rd-declension i-stems, deus/locus (irregular
   plurals).

   Each entry:
     id       stable, written-once slug for this word -- the review history's
              real key (see cardId() in js/fsrs.js). NEVER renumber or reuse
              one: card ids used to be the word's INDEX in this array, so
              inserting a word at the top silently re-pointed every card
              after it at a different word's history, with no error. Slugs
              are derived from the lemma but are data, not a formula: once
              written, a slug is fixed even if the lemma is later corrected.
     lemma    citation form shown to the user (nom. sg. for nouns,
              1st sg. pres. act. indic. for verbs)
     stem     (nouns) oblique stem the paradigm endings attach to
     root     (verbs) bare consonantal root the paradigm endings attach to
     class    key into LATIN_PARADIGMS
     gender   'm' | 'f' | 'n' (nouns only)
     meaning  short gloss, for the UI only -- never graded
   ====================================================================== */

/* ---- `restrict`: words that lack part of their class's pattern ----
   Eight entries below carry a `restrict` map. It names, per category, the ONLY
   cells that word has; a category not mentioned is unrestricted, and an empty
   list means the word has none of that category at all. See engine.js's
   entryHasCell() for the mechanism.

   Every one of these was found by the 2026-08-21 verification pass against
   Wiktionary's own inflection modules (tools/verify/), which compared all 3,285
   drillable Latin cells. Without `restrict` these eight words generated 96
   cells of non-words -- `sedeor`, `facior`, `caela`, `aura` -- and drilled them
   like any other form. They are all common words, so removing them was not a
   real option; the engine had to learn that a word can be a legitimate member
   of a pattern and still lack part of it. */
const LATIN_VOCAB = [

  // ---- 1st declension (f., a few conventionally m.) ----
  { id:'mensa', lemma:'mēnsa',    stem:'mēns',    class:'decl1', gender:'f', meaning:'table' },
  { id:'puella', lemma:'puella',   stem:'puell',   class:'decl1', gender:'f', meaning:'girl' },
  { id:'aqua', lemma:'aqua',     stem:'aqu',     class:'decl1', gender:'f', meaning:'water' },
  { id:'terra', lemma:'terra',    stem:'terr',    class:'decl1', gender:'f', meaning:'land, earth' },
  { id:'vita', lemma:'vīta',     stem:'vīt',     class:'decl1', gender:'f', meaning:'life' },
  { id:'femina', lemma:'fēmina',   stem:'fēmin',   class:'decl1', gender:'f', meaning:'woman' },
  { id:'insula', lemma:'īnsula',   stem:'īnsul',   class:'decl1', gender:'f', meaning:'island' },
  { id:'via', lemma:'via',      stem:'vi',      class:'decl1', gender:'f', meaning:'road, way' },
  { id:'stella', lemma:'stēlla',   stem:'stēll',   class:'decl1', gender:'f', meaning:'star' },
  { id:'rosa', lemma:'rosa',     stem:'ros',     class:'decl1', gender:'f', meaning:'rose' },
  { id:'fortuna', lemma:'fortūna',  stem:'fortūn',  class:'decl1', gender:'f', meaning:'fortune' },
  { id:'cura', lemma:'cūra',     stem:'cūr',     class:'decl1', gender:'f', meaning:'care, worry' },
  { id:'silva', lemma:'silva',    stem:'silv',    class:'decl1', gender:'f', meaning:'forest' },
  { id:'luna', lemma:'lūna',     stem:'lūn',     class:'decl1', gender:'f', meaning:'moon' },
  { id:'patria', lemma:'patria',   stem:'patri',   class:'decl1', gender:'f', meaning:'fatherland' },
  { id:'epistula', lemma:'epistula', stem:'epistul', class:'decl1', gender:'f', meaning:'letter' },
  { id:'agricola', lemma:'agricola', stem:'agricol', class:'decl1', gender:'m', meaning:'farmer' },
  { id:'nauta', lemma:'nauta',    stem:'naut',    class:'decl1', gender:'m', meaning:'sailor' },

  // ---- 2nd declension, masculine (-us) ----
  { id:'dominus', lemma:'dominus', stem:'domin', class:'decl2m', gender:'m', meaning:'master, lord' },
  { id:'servus', lemma:'servus',  stem:'serv',  class:'decl2m', gender:'m', meaning:'slave, servant' },
  { id:'amicus', lemma:'amīcus',  stem:'amīc',  class:'decl2m', gender:'m', meaning:'friend' },
  { id:'equus', lemma:'equus',   stem:'equ',   class:'decl2m', gender:'m', meaning:'horse' },
  { id:'populus', lemma:'populus', stem:'popul', class:'decl2m', gender:'m', meaning:'people' },
  { id:'campus', lemma:'campus',  stem:'camp',  class:'decl2m', gender:'m', meaning:'field' },
  { id:'lupus', lemma:'lupus',   stem:'lup',   class:'decl2m', gender:'m', meaning:'wolf' },
  { id:'murus', lemma:'mūrus',   stem:'mūr',   class:'decl2m', gender:'m', meaning:'wall' },
  { id:'annus', lemma:'annus',   stem:'ann',   class:'decl2m', gender:'m', meaning:'year' },
  { id:'ventus', lemma:'ventus',  stem:'vent',  class:'decl2m', gender:'m', meaning:'wind' },
  { id:'numerus', lemma:'numerus', stem:'numer', class:'decl2m', gender:'m', meaning:'number' },
  { id:'modus', lemma:'modus',   stem:'mod',   class:'decl2m', gender:'m', meaning:'manner, way' },
  { id:'ludus', lemma:'lūdus',   stem:'lūd',   class:'decl2m', gender:'m', meaning:'game, school' },
  { id:'morbus', lemma:'morbus',  stem:'morb',  class:'decl2m', gender:'m', meaning:'disease' },
  { id:'oculus', lemma:'oculus',  stem:'ocul',  class:'decl2m', gender:'m', meaning:'eye' },
  { id:'animus', lemma:'animus',  stem:'anim',  class:'decl2m', gender:'m', meaning:'mind, spirit' },
  { id:'hortus', lemma:'hortus',  stem:'hort',  class:'decl2m', gender:'m', meaning:'garden' },

  // ---- 2nd declension, neuter (-um) ----
  { id:'bellum', lemma:'bellum',     stem:'bell',     class:'decl2n', gender:'n', meaning:'war' },
  { id:'verbum', lemma:'verbum',     stem:'verb',     class:'decl2n', gender:'n', meaning:'word' },
  { id:'donum', lemma:'dōnum',      stem:'dōn',      class:'decl2n', gender:'n', meaning:'gift' },
  { id:'templum', lemma:'templum',    stem:'templ',    class:'decl2n', gender:'n', meaning:'temple' },
  { id:'oppidum', lemma:'oppidum',    stem:'oppid',    class:'decl2n', gender:'n', meaning:'town' },
  { id:'periculum', lemma:'perīculum',  stem:'perīcul',  class:'decl2n', gender:'n', meaning:'danger' },
  // caelum's plural is not neuter -- it is masculine caelī / caelōs, a different
  // pattern this class cannot express, so the three cells that differ are
  // dropped rather than generated wrongly. The genitive, dative and ablative
  // plural are identical either way and stay.
  { id:'caelum', lemma:'caelum',     stem:'cael',     class:'decl2n', gender:'n', meaning:'sky',
    restrict:{ nom:['sg'], voc:['sg'], acc:['sg'] } },
  { id:'frumentum', lemma:'frūmentum',  stem:'frūment',  class:'decl2n', gender:'n', meaning:'grain' },
  { id:'signum', lemma:'signum',     stem:'sign',     class:'decl2n', gender:'n', meaning:'sign, standard' },
  { id:'regnum', lemma:'rēgnum',     stem:'rēgn',     class:'decl2n', gender:'n', meaning:'kingdom' },
  { id:'vinum', lemma:'vīnum',      stem:'vīn',      class:'decl2n', gender:'n', meaning:'wine' },
  { id:'tectum', lemma:'tēctum',     stem:'tēct',     class:'decl2n', gender:'n', meaning:'roof, house' },
  // gold is a mass noun: singulare tantum. Its generated plural would also
  // collide with aura, -ae f. "breeze", a different and common word.
  { id:'aurum', lemma:'aurum',      stem:'aur',      class:'decl2n', gender:'n', meaning:'gold',
    restrict:{ nom:['sg'], voc:['sg'], acc:['sg'], gen:['sg'], dat:['sg'], abl:['sg'] } },
  { id:'astrum', lemma:'astrum',     stem:'astr',     class:'decl2n', gender:'n', meaning:'star' },
  { id:'factum', lemma:'factum',     stem:'fact',     class:'decl2n', gender:'n', meaning:'deed' },
  { id:'votum', lemma:'vōtum',      stem:'vōt',      class:'decl2n', gender:'n', meaning:'vow' },

  // ---- 3rd declension, m./f., consonant stem ----
  { id:'miles', lemma:'mīles',   stem:'mīlit',   class:'decl3mf', gender:'m', meaning:'soldier' },
  { id:'rex', lemma:'rēx',     stem:'rēg',     class:'decl3mf', gender:'m', meaning:'king' },
  { id:'dux', lemma:'dux',     stem:'duc',     class:'decl3mf', gender:'m', meaning:'leader' },
  { id:'pes', lemma:'pēs',     stem:'ped',     class:'decl3mf', gender:'m', meaning:'foot' },
  { id:'mos', lemma:'mōs',     stem:'mōr',     class:'decl3mf', gender:'m', meaning:'custom' },
  { id:'comes', lemma:'comes',   stem:'comit',   class:'decl3mf', gender:'m', meaning:'companion' },
  { id:'custos', lemma:'custōs',  stem:'custōd',  class:'decl3mf', gender:'m', meaning:'guard' },
  { id:'virtus', lemma:'virtūs',  stem:'virtūt',  class:'decl3mf', gender:'f', meaning:'courage, virtue' },
  { id:'salus', lemma:'salūs',   stem:'salūt',   class:'decl3mf', gender:'f', meaning:'safety, health' },
  { id:'lex', lemma:'lēx',     stem:'lēg',     class:'decl3mf', gender:'f', meaning:'law' },
  { id:'vox', lemma:'vōx',     stem:'vōc',     class:'decl3mf', gender:'f', meaning:'voice' },
  { id:'pax', lemma:'pāx',     stem:'pāc',     class:'decl3mf', gender:'f', meaning:'peace' },
  { id:'homo', lemma:'homō',    stem:'homin',   class:'decl3mf', gender:'m', meaning:'human being' },
  { id:'sermo', lemma:'sermō',   stem:'sermōn',  class:'decl3mf', gender:'m', meaning:'speech, conversation' },
  { id:'legio', lemma:'legiō',   stem:'legiōn',  class:'decl3mf', gender:'f', meaning:'legion' },
  { id:'regio', lemma:'regiō',   stem:'regiōn',  class:'decl3mf', gender:'f', meaning:'region' },
  { id:'ratio', lemma:'ratiō',   stem:'ratiōn',  class:'decl3mf', gender:'f', meaning:'reason' },

  // ---- 3rd declension, neuter, consonant stem ----
  { id:'corpus', lemma:'corpus',  stem:'corpor',  class:'decl3n', gender:'n', meaning:'body' },
  { id:'tempus', lemma:'tempus',  stem:'tempor',  class:'decl3n', gender:'n', meaning:'time' },
  { id:'genus', lemma:'genus',   stem:'gener',   class:'decl3n', gender:'n', meaning:'kind, race' },
  { id:'opus', lemma:'opus',    stem:'oper',    class:'decl3n', gender:'n', meaning:'work' },
  { id:'onus', lemma:'onus',    stem:'oner',    class:'decl3n', gender:'n', meaning:'burden' },
  { id:'scelus', lemma:'scelus',  stem:'sceler',  class:'decl3n', gender:'n', meaning:'crime' },
  { id:'vulnus', lemma:'vulnus',  stem:'vulner',  class:'decl3n', gender:'n', meaning:'wound' },
  { id:'pectus', lemma:'pectus',  stem:'pector',  class:'decl3n', gender:'n', meaning:'chest, heart' },
  { id:'litus', lemma:'lītus',   stem:'lītor',   class:'decl3n', gender:'n', meaning:'shore' },
  { id:'nomen', lemma:'nōmen',   stem:'nōmin',   class:'decl3n', gender:'n', meaning:'name' },
  { id:'flumen', lemma:'flūmen',  stem:'flūmin',  class:'decl3n', gender:'n', meaning:'river' },
  { id:'crimen', lemma:'crīmen',  stem:'crīmin',  class:'decl3n', gender:'n', meaning:'accusation, crime' },
  { id:'carmen', lemma:'carmen',  stem:'carmin',  class:'decl3n', gender:'n', meaning:'song, poem' },
  { id:'iter', lemma:'iter',    stem:'itiner',  class:'decl3n', gender:'n', meaning:'journey, route' },
  { id:'foedus', lemma:'foedus',  stem:'foeder',  class:'decl3n', gender:'n', meaning:'treaty' },

  // ---- 1st conjugation ----
  { id:'amo', lemma:'amō',      root:'am',      class:'conj1', meaning:'to love' },
  { id:'laudo', lemma:'laudō',    root:'laud',    class:'conj1', meaning:'to praise' },
  { id:'voco', lemma:'vocō',     root:'voc',     class:'conj1', meaning:'to call' },
  { id:'paro', lemma:'parō',     root:'par',     class:'conj1', meaning:'to prepare' },
  { id:'porto', lemma:'portō',    root:'port',    class:'conj1', meaning:'to carry' },
  { id:'spero', lemma:'spērō',    root:'spēr',    class:'conj1', meaning:'to hope' },
  { id:'oro', lemma:'ōrō',      root:'ōr',      class:'conj1', meaning:'to pray, beg' },
  { id:'pugno', lemma:'pugnō',    root:'pugn',    class:'conj1', meaning:'to fight' },
  { id:'navigo', lemma:'nāvigō',   root:'nāvig',   class:'conj1', meaning:'to sail' },
  { id:'habito', lemma:'habitō',   root:'habit',   class:'conj1', meaning:'to dwell' },
  { id:'monstro', lemma:'mōnstrō',  root:'mōnstr',  class:'conj1', meaning:'to show' },
  { id:'servo', lemma:'servō',    root:'serv',    class:'conj1', meaning:'to save, guard' },
  { id:'supero', lemma:'superō',   root:'super',   class:'conj1', meaning:'to overcome' },
  { id:'occupo', lemma:'occupō',   root:'occup',   class:'conj1', meaning:'to seize' },
  { id:'cogito', lemma:'cōgitō',   root:'cōgit',   class:'conj1', meaning:'to think' },
  { id:'ambulo', lemma:'ambulō',   root:'ambul',   class:'conj1', meaning:'to walk' },

  // ---- 2nd conjugation ----
  { id:'moneo', lemma:'moneō',     root:'mon',     class:'conj2', meaning:'to warn' },
  { id:'video', lemma:'videō',     root:'vid',     class:'conj2', meaning:'to see' },
  { id:'habeo', lemma:'habeō',     root:'hab',     class:'conj2', meaning:'to have' },
  { id:'teneo', lemma:'teneō',     root:'ten',     class:'conj2', meaning:'to hold' },
  { id:'debeo', lemma:'dēbeō',     root:'dēb',     class:'conj2', meaning:'to owe, ought' },
  { id:'timeo', lemma:'timeō',     root:'tim',     class:'conj2', meaning:'to fear' },
  { id:'maneo', lemma:'maneō',     root:'man',     class:'conj2', meaning:'to remain' },
  { id:'doceo', lemma:'doceō',     root:'doc',     class:'conj2', meaning:'to teach' },
  { id:'moveo', lemma:'moveō',     root:'mov',     class:'conj2', meaning:'to move' },
  // third person only in the passive
  { id:'respondeo', lemma:'respondeō', root:'respond', class:'conj2', meaning:'to answer',
    restrict:{ 'pres.pass':['3sg','3pl'], 'impf.pass':['3sg','3pl'], 'fut.pass':['3sg','3pl'] } },
  { id:'terreo', lemma:'terreō',    root:'terr',    class:'conj2', meaning:'to frighten' },
  { id:'iubeo', lemma:'iubeō',     root:'iub',     class:'conj2', meaning:'to order' },
  // intransitive: the passive is impersonal, so only the third singular exists
  { id:'sedeo', lemma:'sedeō',     root:'sed',     class:'conj2', meaning:'to sit',
    restrict:{ 'pres.pass':['3sg'], 'impf.pass':['3sg'], 'fut.pass':['3sg'] } },
  { id:'careo', lemma:'careō',     root:'car',     class:'conj2', meaning:'to lack' },
  { id:'studeo', lemma:'studeō',    root:'stud',    class:'conj2', meaning:'to study, be eager for',
    restrict:{ 'pres.pass':['3sg','3pl'], 'impf.pass':['3sg','3pl'], 'fut.pass':['3sg','3pl'] } },

  // ---- 4th conjugation ----
  { id:'audio', lemma:'audiō',    root:'aud',    class:'conj4', meaning:'to hear' },
  { id:'venio', lemma:'veniō',    root:'ven',    class:'conj4', meaning:'to come',
    restrict:{ 'pres.pass':['3sg'], 'impf.pass':['3sg'], 'fut.pass':['3sg'] } },
  { id:'sentio', lemma:'sentiō',   root:'sent',   class:'conj4', meaning:'to feel, perceive' },
  { id:'dormio', lemma:'dormiō',   root:'dorm',   class:'conj4', meaning:'to sleep',
    restrict:{ 'pres.pass':['3sg'], 'impf.pass':['3sg'], 'fut.pass':['3sg'] } },
  { id:'invenio', lemma:'inveniō',  root:'inven',  class:'conj4', meaning:'to find' },
  { id:'scio', lemma:'sciō',     root:'sc',     class:'conj4', meaning:'to know' },
  { id:'nescio', lemma:'nesciō',   root:'nesc',   class:'conj4', meaning:'to not know' },
  { id:'munio', lemma:'mūniō',    root:'mūn',    class:'conj4', meaning:'to fortify' },
  { id:'custodio', lemma:'custōdiō', root:'custōd', class:'conj4', meaning:'to guard' },
  { id:'finio', lemma:'fīniō',    root:'fīn',    class:'conj4', meaning:'to finish' },
  { id:'punio', lemma:'pūniō',    root:'pūn',    class:'conj4', meaning:'to punish' },
  { id:'vestio', lemma:'vestiō',   root:'vest',   class:'conj4', meaning:'to clothe' },

  // ---- 3rd conjugation ----
  { id:'duco', lemma:'dūcō',    root:'dūc',    class:'conj3', meaning:'to lead' },
  { id:'mitto', lemma:'mittō',   root:'mitt',   class:'conj3', meaning:'to send' },
  { id:'rego', lemma:'regō',    root:'reg',    class:'conj3', meaning:'to rule' },
  { id:'scribo', lemma:'scrībō',  root:'scrīb',  class:'conj3', meaning:'to write' },
  { id:'vinco', lemma:'vincō',   root:'vinc',   class:'conj3', meaning:'to conquer' },
  { id:'dico', lemma:'dīcō',    root:'dīc',    class:'conj3', meaning:'to say' },
  { id:'ago', lemma:'agō',     root:'ag',     class:'conj3', meaning:'to do, drive' },
  { id:'peto', lemma:'petō',    root:'pet',    class:'conj3', meaning:'to seek' },
  { id:'curro', lemma:'currō',   root:'curr',   class:'conj3', meaning:'to run' },
  { id:'credo', lemma:'crēdō',   root:'crēd',   class:'conj3', meaning:'to believe' },
  { id:'verto', lemma:'vertō',   root:'vert',   class:'conj3', meaning:'to turn' },
  { id:'pono', lemma:'pōnō',    root:'pōn',    class:'conj3', meaning:'to place' },

  // ---- 3rd conjugation, -iō ----
  { id:'capio', lemma:'capiō',  root:'cap',  class:'conj3io', meaning:'to take, seize' },
  // faciō has no passive of its own: it is suppletive, supplied by fīō (fīō,
  // fīs, fit, fīmus, fītis, fīunt), which this app already carries as its own
  // `fio` class. So the active is drilled here and the passive is not drilled
  // at all rather than being invented.
  { id:'facio', lemma:'faciō',  root:'fac',  class:'conj3io', meaning:'to make, do',
    restrict:{ 'pres.pass':[], 'impf.pass':[], 'fut.pass':[] } },
  { id:'iacio', lemma:'iaciō',  root:'iac',  class:'conj3io', meaning:'to throw' },
  { id:'fugio', lemma:'fugiō',  root:'fug',  class:'conj3io', meaning:'to flee' },
  { id:'cupio', lemma:'cupiō',  root:'cup',  class:'conj3io', meaning:'to desire' },
  { id:'rapio', lemma:'rapiō',  root:'rap',  class:'conj3io', meaning:'to seize, snatch' },
  { id:'pario', lemma:'pariō',  root:'par',  class:'conj3io', meaning:'to give birth to, produce' },

  // ---- irregular verbs ----
  // No stem/root: these classes are `literal` (see latin-paradigms.js) --
  // formsFor() uses the class's endings table directly, unchanged.
  { id:'sum', lemma:'sum',    class:'sum',    meaning:'to be' },
  { id:'possum', lemma:'possum', class:'possum', meaning:'to be able' },
  { id:'eo', lemma:'eō',     class:'eo',     meaning:'to go' },
  { id:'fero', lemma:'ferō',   class:'fero',   meaning:'to carry, bear' },
  { id:'volo', lemma:'volō',   class:'volo',   meaning:'to want, wish' },
  { id:'nolo', lemma:'nōlō',   class:'nolo',   meaning:'to not want, be unwilling' },
  { id:'malo', lemma:'mālō',   class:'malo',   meaning:'to prefer' },
  { id:'fio', lemma:'fīō',    class:'fio',    meaning:'to become, be made' }

];
