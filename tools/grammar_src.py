#!/usr/bin/env python3
"""Grammatik-Themen und Übungen (Stand Lesson 28). Erzeugt data/grammar.json.

Übungstypen:
  mc    – Lücke mit Auswahl. opts[0] ist richtig (die App mischt).
  type  – Eingabe. ans = Liste akzeptierter Antworten.
  order – Satz aus Wörtern bauen. ans = Zielsatz.
Neue Themen/Übungen beim Wochenlauf einfach unten anhängen.
"""
import json
from pathlib import Path

T = []


def topic(id, title, lessons, rule, items):
    T.append({"id": id, "title": title, "lessons": lessons, "rule": rule, "items": items})


def mc(q, de, opts, ex=""):
    return {"t": "mc", "q": q, "de": de, "opts": opts, "ex": ex}


def ty(q, de, ans, ex=""):
    return {"t": "type", "q": q, "de": de, "ans": ans if isinstance(ans, list) else [ans], "ex": ex}


def od(de, ans, ex=""):
    return {"t": "order", "de": de, "ans": ans, "ex": ex}


topic("art", "Artikel & Plural", [1, 2],
      "<p><b>el</b> / <b>los</b> (m.), <b>la</b> / <b>las</b> (f.) – unbestimmt: <b>un, una, unos, unas</b>.</p>"
      "<p>Plural: Vokal + <b>-s</b> (la mesa → las mesas), Konsonant + <b>-es</b> (el tren → los trenes, el autobús → los autobuses).</p>"
      "<p>Achtung: <b>el problema, el idioma, el día, el mapa</b> sind maskulin; <b>la mano, la radio</b> feminin.</p>",
      [
          mc("___ mesa", "der Tisch", ["la", "el", "los", "las"], "mesa endet auf -a → feminin."),
          mc("___ trenes", "die Züge", ["los", "las", "el", "unos"], "Plural maskulin."),
          mc("___ problema", "das Problem", ["el", "la", "los", "una"], "problema ist maskulin, obwohl es auf -a endet."),
          mc("___ idioma es difícil.", "Die Sprache ist schwierig.", ["El", "La", "Los", "Una"], "idioma ist maskulin."),
          mc("Hay ___ farmacia cerca.", "Es gibt eine Apotheke in der Nähe.", ["una", "un", "la", "unas"], "Nach hay steht meist der unbestimmte Artikel."),
          ty("el hotel → los ___", "die Hotels", ["hoteles"], "Konsonant + -es."),
          ty("el autobús → los ___", "die Busse", ["autobuses"], "Konsonant + -es, der Akzent fällt weg."),
          ty("la ciudad → las ___", "die Städte", ["ciudades"], "Konsonant + -es."),
          ty("el niño guapo → los niños ___", "die hübschen Kinder", ["guapos"], "Adjektiv geht mit in den Plural."),
          mc("___ día", "der Tag", ["el", "la", "los", "una"], "día ist maskulin."),
      ])

topic("ser", "Verb ser", [2, 5],
      "<p><b>soy, eres, es, somos, sois, son</b></p>"
      "<p>ser für <b>Identität</b> (Soy Christian), <b>Herkunft/Nationalität</b> (Soy de Alemania, soy alemán), <b>Beruf</b> (Es periodista), "
      "<b>Beschreibung/Charakter</b> (Es alto y simpático), <b>Material</b> (La mesa es de madera), Uhrzeit (Son las tres).</p>",
      [
          mc("Vosotros ___ alemanes, ¿verdad?", "Ihr seid Deutsche, oder?", ["sois", "son", "somos", "estáis"]),
          mc("Nosotros ___ ingleses.", "Wir sind Engländer.", ["somos", "son", "estamos", "sois"]),
          mc("¿Usted ___ el Director General?", "Sind Sie der Generaldirektor?", ["es", "eres", "está", "son"], "usted wird wie 3. Person konjugiert."),
          mc("¿Y tú de dónde ___?", "Und woher kommst du?", ["eres", "es", "estás", "soy"]),
          mc("Mallorca ___ una isla preciosa.", "Mallorca ist eine wunderschöne Insel.", ["es", "está", "hay", "son"]),
          mc("La mesa ___ de madera.", "Der Tisch ist aus Holz.", ["es", "está", "tiene", "son"], "Material → ser."),
          mc("Mi novio ___ periodista y yo ___ economista.", "Mein Freund ist Journalist und ich Ökonomin.", ["es / soy", "está / estoy", "es / es", "son / soy"]),
          ty("Ella ___ de Valencia.", "Sie ist aus Valencia.", ["es"]),
          ty("Todos mis alumnos ___ alemanes.", "Alle meine Schüler sind Deutsche.", ["son"]),
          od("Ich bin aus Deutschland.", "Soy de Alemania."),
          od("Mein Lehrer ist dünn und groß.", "Mi profesor es delgado y alto."),
      ])

topic("estar", "Verb estar", [6, 7],
      "<p><b>estoy, estás, está, estamos, estáis, están</b></p>"
      "<p>estar für <b>Ort/Position</b> (estar en: Estoy en Palma), <b>Laune</b> (Hoy estoy contento), <b>Gesundheit</b> (Está resfriado), "
      "<b>Familienstand</b> (Estamos casados) und <b>Zustand</b> (La tienda está cerrada).</p>",
      [
          mc("Hoy ___ muy contento.", "Heute bin ich sehr froh.", ["estoy", "soy", "está", "tengo"], "Laune → estar."),
          mc("Mi hermano ___ resfriado.", "Mein Bruder ist erkältet.", ["está", "es", "tiene", "hay"], "Gesundheit → estar."),
          mc("Nosotros ___ casados.", "Wir sind verheiratet.", ["estamos", "somos", "están", "tenemos"], "Familienstand → estar (Isa, L6)."),
          mc("Las tiendas ___ cerradas.", "Die Läden sind geschlossen.", ["están", "son", "hay", "está"]),
          mc("¿Dónde ___ los pasajeros?", "Wo sind die Passagiere?", ["están", "son", "hay", "estáis"]),
          mc("Mi marido ___ en Alemania.", "Mein Mann ist in Deutschland.", ["está", "es", "hay", "va"]),
          ty("¿Cómo ___ (tú)?", "Wie geht es dir?", ["estás"]),
          ty("(yo) ___ cansado.", "Ich bin müde.", ["estoy"]),
          ty("Vosotros ___ estresados.", "Ihr seid gestresst.", ["estáis", "estais"]),
          od("Die Bücher sind in der Tasche.", "Los libros están en la cartera."),
      ])

topic("serestar", "ser oder estar", [6, 7, 8, 13],
      "<p><b>ser</b> = was/wer etwas ist (Identität, Herkunft, Beruf, Charakter, Material).</p>"
      "<p><b>estar</b> = wo etwas ist und wie es gerade ist (Ort, Laune, Gesundheit, Zustand).</p>"
      "<p>Merksatz aus L6: Estar bei möglicher Statusänderung und bei Ortsangaben.</p>"
      "<p>Achtung: <b>El es de Florida</b> (Herkunft), nicht <i>está de Florida</i>.</p>",
      [
          mc("John ___ de Florida.", "John ist aus Florida.", ["es", "está"], "Herkunft → ser."),
          mc("Él ___ profesor.", "Er ist Lehrer.", ["es", "está"], "Beruf → ser."),
          mc("Mi hermana ___ morena y ___ muy simpática.", "Meine Schwester ist brünett und sehr sympathisch.", ["es / es", "está / está", "es / está", "está / es"]),
          mc("El café ___ frío.", "Der Kaffee ist kalt (geworden).", ["está", "es"], "Momentaner Zustand → estar."),
          mc("Madrid ___ la capital de España.", "Madrid ist die Hauptstadt Spaniens.", ["es", "está"]),
          mc("Madrid ___ en el centro de España.", "Madrid liegt im Zentrum Spaniens.", ["está", "es"], "Lage → estar."),
          mc("Hoy ___ cansada.", "Heute bin ich müde.", ["estoy", "soy"]),
          mc("La plaza de España ___ muy grande y muy famosa.", "Die Plaza de España ist sehr groß und berühmt.", ["es", "está"]),
          mc("¿Qué hora ___?", "Wie spät ist es?", ["es", "está"], "Uhrzeit → ser."),
          mc("La farmacia ___ abierta.", "Die Apotheke ist geöffnet.", ["está", "es"]),
          mc("Mi padre ___ médico pero hoy ___ enfermo.", "Mein Vater ist Arzt, aber heute ist er krank.", ["es / está", "está / es", "es / es", "está / está"]),
      ])

topic("hay", "hay oder estar", [2, 7],
      "<p><b>hay</b> (von haber) = es gibt – für etwas Unbestimmtes: <i>Hay una farmacia cerca.</i> ¿Qué hay en la mesa?</p>"
      "<p><b>estar</b> = befindet sich – für etwas Bestimmtes: <i>La farmacia está en esta calle.</i></p>"
      "<p>hay + un/una/unos/Zahl/mucho/nada; está/están + el/la/mi/Namen.</p>",
      [
          mc("¿___ una farmacia cerca de aquí?", "Gibt es hier in der Nähe eine Apotheke?", ["Hay", "Está", "Es", "Tiene"]),
          mc("La farmacia ___ en esta calle.", "Die Apotheke ist in dieser Straße.", ["está", "hay", "es", "están"]),
          mc("¿Cuántos bancos ___ en esta calle?", "Wie viele Banken gibt es in dieser Straße?", ["hay", "están", "son", "tienen"]),
          mc("¿___ algo en la mesa? – No, no ___ nada.", "Liegt etwas auf dem Tisch? – Nein, nichts.", ["Hay / hay", "Está / está", "Es / es", "Hay / está"]),
          mc("Mis gafas ___ en el coche.", "Meine Brille ist im Auto.", ["están", "hay", "son", "está"]),
          mc("En mi casa ___ cuatro personas.", "In meinem Haus wohnen/sind vier Personen.", ["hay", "están", "son", "es"]),
          ty("¿Cuántas niñas ___ en tu escuela?", "Wie viele Mädchen gibt es in deiner Schule?", ["hay"]),
          od("Wo gibt es eine Apotheke in der Nähe?", "¿Dónde hay una farmacia cerca?"),
      ])

topic("preg", "Fragewörter", [2, 4],
      "<p><b>¿Qué?</b> was · <b>¿Cómo?</b> wie · <b>¿Dónde?</b> wo · <b>¿Adónde?</b> wohin · <b>¿De dónde?</b> woher · "
      "<b>¿Quién/Quiénes?</b> wer · <b>¿Cuál/Cuáles?</b> welche(r) · <b>¿Cuánto/a/os/as?</b> wie viel(e) · <b>¿Cuándo?</b> wann · "
      "<b>¿Por qué?</b> warum – Antwort: <b>porque</b>.</p><p>Fragewörter tragen immer einen Akzent.</p>",
      [
          mc("¿___ eres? – Soy de Alemania.", "Woher kommst du?", ["De dónde", "Dónde", "Adónde", "Cómo"]),
          mc("¿___ vives? – Vivo en Mallorca.", "Wo wohnst du?", ["Dónde", "De dónde", "Adónde", "Cuándo"]),
          mc("¿___ va el tren? – A París.", "Wohin fährt der Zug?", ["Adónde", "Dónde", "De dónde", "Cuál"]),
          mc("¿___ son tus hijos?", "Welche sind deine Kinder?", ["Cuáles", "Cuál", "Quién", "Qué"]),
          mc("¿___ es todo?", "Wie viel macht alles?", ["Cuánto", "Cuántos", "Qué", "Cómo"]),
          mc("¿___ bancos hay?", "Wie viele Banken gibt es?", ["Cuántos", "Cuánto", "Cuántas", "Qué"]),
          mc("¿___ estudias español? – ___ vivo en Mallorca.", "Warum lernst du Spanisch? – Weil ich auf Mallorca lebe.", ["Por qué / Porque", "Porque / Por qué", "Qué / Porque", "Cómo / Por"]),
          mc("¿___ es ese señor?", "Wer ist dieser Herr?", ["Quién", "Quiénes", "Cuál", "Qué"]),
          ty("¿___ te llamas?", "Wie heißt du?", ["Cómo", "cómo", "como"]),
          ty("¿___ hora es?", "Wie spät ist es?", ["Qué", "qué", "que"]),
      ])

topic("reg", "Regelmäßige Verben (Präsens)", [3, 9],
      "<p><b>-ar</b> hablar: hablo, hablas, habla, hablamos, habláis, hablan</p>"
      "<p><b>-er</b> comer: como, comes, come, comemos, coméis, comen</p>"
      "<p><b>-ir</b> vivir: vivo, vives, vive, vivimos, vivís, viven</p>",
      [
          ty("leer – yo ___", "ich lese", ["leo"]),
          ty("leer – vosotros ___", "ihr lest", ["leéis", "leeis"]),
          ty("hablar – nosotros ___", "wir sprechen", ["hablamos"]),
          ty("vivir – ellos ___", "sie wohnen", ["viven"]),
          ty("trabajar – tú ___", "du arbeitest", ["trabajas"]),
          ty("comer – usted ___", "Sie essen", ["come"]),
          ty("escribir – nosotros ___", "wir schreiben", ["escribimos"]),
          ty("estudiar – yo ___", "ich lerne", ["estudio"]),
          mc("Él ___ tres idiomas.", "Er spricht drei Sprachen.", ["habla", "hablo", "hablas", "hablan"]),
          mc("Los estudiantes ___ ya bastante español.", "Die Studenten sprechen schon ziemlich gut Spanisch.", ["hablan", "habla", "hablamos", "habláis"]),
          mc("Esta noche ___ en un restaurante.", "Heute Abend essen wir in einem Restaurant.", ["cenamos", "cenan", "ceno", "cenáis"]),
          od("Mein Bruder lebt im Ausland.", "Mi hermano vive en el extranjero."),
      ])

topic("tener", "tener, tener que, tener ganas", [4, 8, 25, 27],
      "<p><b>tengo, tienes, tiene, tenemos, tenéis, tienen</b></p>"
      "<p><b>tener que</b> + Infinitiv = müssen: <i>Tengo que preparar la comida.</i></p>"
      "<p>Ausdrücke: <b>tener ganas de</b> (Lust haben), <b>tener prisa</b> (es eilig haben), <b>tener fiebre</b>, <b>tener ... años</b>, <b>tener hambre/sed</b>.</p>",
      [
          mc("___ dos hijos: un niño y una niña.", "Wir haben zwei Kinder.", ["Tenemos", "Tienen", "Tengo", "Somos"]),
          mc("___ que leer.", "Ich muss lesen.", ["Tengo", "Tiene", "Hay", "Debo de"]),
          mc("Tengo que estudiar mucho, pero no ___ ganas.", "Ich muss viel lernen, aber ich habe keine Lust.", ["tengo", "tiene", "estoy", "hay"]),
          mc("Lo siento, ___ prisa.", "Tut mir leid, ich habe es eilig.", ["tengo", "estoy", "soy", "hay"]),
          mc("Mi hijo ___ fiebre.", "Mein Sohn hat Fieber.", ["tiene", "está", "es", "tengo"]),
          mc("¿Cuántos años ___ (tú)?", "Wie alt bist du?", ["tienes", "eres", "estás", "tiene"]),
          ty("Nosotros ___ un perro.", "Wir haben einen Hund.", ["tenemos"]),
          ty("Ellos ___ que trabajar mañana.", "Sie müssen morgen arbeiten.", ["tienen"]),
          od("Ich muss das Essen vorbereiten.", "Tengo que preparar la comida."),
          od("Ich habe viel zu tun.", "Tengo mucho que hacer."),
          od("Hast du Lust, ins Kino zu gehen?", "¿Tienes ganas de ir al cine?"),
      ])

topic("pos", "Possessivbegleiter", [5, 18],
      "<p><b>mi/mis</b> mein · <b>tu/tus</b> dein · <b>su/sus</b> sein/ihr/Ihr · <b>nuestro/a/os/as</b> unser · <b>vuestro/a/os/as</b> euer · <b>su/sus</b> ihr (Pl.)</p>"
      "<p>Richtet sich nach dem <b>Besitz</b>, nicht nach dem Besitzer: <i>nuestras hijas</i>. Betont nachgestellt: <b>mío, tuyo, suyo</b> (cuadros míos).</p>",
      [
          mc("___ perro tiene ___ casita en el jardín.", "Unser Hund hat seine Hütte im Garten.", ["Nuestro / su", "Nuestro / mi", "Mi / tu", "Su / nuestra"]),
          mc("___ padres no entienden ___ gustos.", "Unsere Eltern verstehen unseren Geschmack nicht.", ["Nuestros / nuestros", "Nuestro / nuestras", "Sus / mis", "Mis / tu"]),
          mc("¿Cuáles son ___ hijos?", "Welche sind deine Kinder?", ["tus", "tu", "su", "mis"]),
          mc("Es ___ casa (de nosotros).", "Das ist unser Haus.", ["nuestra", "nuestro", "nuestras", "su"]),
          mc("___ hermanas viven en Madrid (de vosotros).", "Eure Schwestern leben in Madrid.", ["Vuestras", "Vuestros", "Vuestra", "Sus"]),
          mc("Señor Pérez, ¿es ___ coche?", "Herr Pérez, ist das Ihr Auto?", ["su", "tu", "mi", "vuestro"], "usted → su."),
          ty("mi hijo → ___ hijos", "meine Söhne / Kinder", ["mis"]),
          ty("tu amiga → ___ amigas", "deine Freundinnen", ["tus"]),
          od("Mein Lieblingsplatz ist mein Zimmer.", "Mi lugar favorito es mi habitación."),
      ])

topic("num", "Zahlen", [5, 20],
      "<p>16–29 zusammengeschrieben: <b>dieciséis, veinte, veintiuno, veintiséis</b>. Ab 31 mit <b>y</b>: <b>treinta y uno, cuarenta y siete</b>.</p>"
      "<p>100 = <b>cien</b>, 101 = ciento uno, 2026 = <b>dos mil veintiséis</b>.</p>",
      [
          mc("58", "", ["cincuenta y ocho", "cincuenta ocho", "quinientos ocho", "ochenta y cinco"]),
          mc("47", "", ["cuarenta y siete", "setenta y cuatro", "cuarenta siete", "cuatrocientos siete"]),
          mc("93", "", ["noventa y tres", "nueve y tres", "treinta y nueve", "novecientos tres"]),
          mc("26", "", ["veintiséis", "veinte y seis", "dieciséis", "sesenta y dos"]),
          mc("15", "", ["quince", "cinco", "cincuenta", "diecicinco"]),
          mc("2026", "", ["dos mil veintiséis", "dos mil veinte y seis", "veinte veintiséis", "dosmil veintiséis"]),
          ty("100", "", ["cien"]),
          ty("12", "", ["doce"]),
          ty("65", "", ["sesenta y cinco"]),
          ty("74", "", ["setenta y cuatro"]),
          ty("32", "", ["treinta y dos"]),
      ])

topic("hora", "Uhrzeit", [12, 13, 16],
      "<p><b>¿Qué hora es?</b> – <b>Es la una</b> / <b>Son las dos</b>. <b>y cuarto</b> (Viertel nach), <b>y media</b> (halb), <b>menos cuarto</b> (Viertel vor).</p>"
      "<p>Um wie viel Uhr? <b>¿A qué hora...?</b> – <b>A las nueve</b>. Tageszeit: <b>de la mañana / de la tarde / de la noche</b>.</p>",
      [
          mc("1:00", "Es ist ein Uhr.", ["Es la una.", "Son la una.", "Es las una.", "Son las uno."]),
          mc("3:30", "", ["Son las tres y media.", "Son las tres y treinta y media.", "Es la tres y media.", "Son las cuatro menos media."]),
          mc("7:45", "", ["Son las ocho menos cuarto.", "Son las siete menos cuarto.", "Son las ocho y cuarto.", "Es la siete y cuarto."]),
          mc("10:15", "", ["Son las diez y cuarto.", "Son las diez menos cuarto.", "Es la diez y cuarto.", "Son las once menos cuarto."]),
          mc("¿A qué hora llega el avión de Dortmund? – ___ las once.", "Um elf.", ["A", "En", "Son", "De"]),
          mc("El supermercado abre ___ 8.30 ___ 21.30.", "Der Supermarkt hat von 8.30 bis 21.30 offen.", ["de / a", "a / de", "en / a", "desde / hasta las"]),
          ty("2:00 → Son las ___.", "", ["dos"]),
          ty("9:30 → Son las nueve y ___.", "", ["media"]),
          od("Um wie viel Uhr fängst du an?", "¿A qué hora empiezas?"),
      ])

topic("stamm", "Stammwechsel e→ie, o→ue", [15, 16, 17, 27],
      "<p>In allen Formen außer nosotros/vosotros ändert sich der Stamm:</p>"
      "<p><b>e→ie</b>: empezar → emp<b>ie</b>zo, querer → qu<b>ie</b>ro, cerrar → c<b>ie</b>rra, preferir → pref<b>ie</b>ro</p>"
      "<p><b>o→ue</b>: poder → p<b>ue</b>do, almorzar → alm<b>ue</b>rzo, volver → v<b>ue</b>lvo, volar → v<b>ue</b>lo</p>"
      "<p>Aber: <b>empezamos, podemos, almorzáis</b>.</p>",
      [
          ty("empezar – yo ___", "ich fange an", ["empiezo"]),
          ty("almorzar – yo ___", "ich esse zu Mittag", ["almuerzo"]),
          ty("poder – yo ___", "ich kann", ["puedo"]),
          ty("volar – yo ___", "ich fliege", ["vuelo"]),
          ty("querer – tú ___", "du willst", ["quieres"]),
          ty("poder – nosotros ___", "wir können", ["podemos"]),
          mc("Las tiendas ___ a las 20 h.", "Die Läden schließen um 20 Uhr.", ["cierran", "cerran", "cierramos", "cierra"]),
          mc("¿A qué hora ___ (vosotros)?", "Um wie viel Uhr fangt ihr an?", ["empezáis", "empiezáis", "empiezan", "empezamos"]),
          mc("No ___ ir al cine esta tarde.", "Ich kann heute Nachmittag nicht ins Kino.", ["puedo", "podo", "puede", "podemos"]),
          mc("Nosotros ___ a las dos.", "Wir essen um zwei zu Mittag.", ["almorzamos", "almuerzamos", "almuerzan", "almorzo"]),
          od("Wir kommen am 10. Mai aus Deutschland nach Mallorca zurück.", "Volvemos de Alemania a Mallorca el día diez de mayo."),
      ])

topic("yo", "Unregelmäßige ich-Formen", [15, 16, 27],
      "<p>Nur die ich-Form ist anders: <b>hacer → hago</b>, <b>salir → salgo</b>, <b>poner → pongo</b>, <b>recoger → recojo</b>, "
      "<b>saber → sé</b>, <b>conocer → conozco</b>, <b>tener → tengo</b>, <b>venir → vengo</b>, <b>ver → veo</b>.</p>",
      [
          ty("hacer – yo ___", "ich mache", ["hago"]),
          ty("salir – yo ___", "ich gehe aus", ["salgo"]),
          ty("recoger – yo ___", "ich hole ab / räume auf", ["recojo"]),
          ty("saber – yo ___", "ich weiß / kann", ["sé", "se"]),
          ty("poner – yo ___", "ich lege / stelle", ["pongo"]),
          ty("conocer – yo ___", "ich kenne", ["conozco"]),
          mc("Yo ___ los deberes por la tarde.", "Ich mache die Hausaufgaben am Nachmittag.", ["hago", "hace", "hacio", "haco"]),
          mc("Yo ___ a los niños a las cinco.", "Ich hole die Kinder um fünf ab.", ["recojo", "recogo", "recoge", "recojio"]),
          mc("Los viernes ___ de fiesta.", "Freitags gehe ich feiern.", ["salgo", "salo", "sale", "salimos"]),
      ])

topic("refl", "Reflexive Verben & Tagesablauf", [15],
      "<p>Das Pronomen steht vor dem Verb: <b>me, te, se, nos, os, se</b>.</p>"
      "<p>levantarse: <b>me levanto, te levantas, se levanta, nos levantamos, os levantáis, se levantan</b>. "
      "Ebenso: ducharse, vestirse (me visto), acostarse (me acuesto), alegrarse de.</p>",
      [
          mc("Yo ___ levanto a las siete.", "Ich stehe um sieben auf.", ["me", "te", "se", "nos"]),
          mc("Mi mujer ___ ducha por la mañana.", "Meine Frau duscht morgens.", ["se", "me", "te", "nos"]),
          mc("Nosotros ___ acostamos tarde.", "Wir gehen spät ins Bett.", ["nos", "se", "os", "me"]),
          mc("¿A qué hora ___ levantas?", "Um wie viel Uhr stehst du auf?", ["te", "se", "me", "os"]),
          mc("Ella ___ alegra mucho de vivir en Mallorca.", "Sie freut sich sehr, auf Mallorca zu leben.", ["se", "le", "me", "la"]),
          ty("acostarse – yo me ___", "ich gehe ins Bett", ["acuesto"]),
          ty("vestirse – yo me ___", "ich ziehe mich an", ["visto"]),
          od("Ich stehe um sieben auf und dusche.", "Me levanto a las siete y me ducho."),
      ])

topic("ir", "ir & ir a + Infinitiv", [17, 27],
      "<p>ir: <b>voy, vas, va, vamos, vais, van</b> – ir <b>a</b> + Ort (a + el = <b>al</b>): <i>Voy al mercado.</i></p>"
      "<p>Nahe Zukunft: <b>ir a + Infinitiv</b>: <i>¿Qué vas a hacer mañana? – Voy a visitar a mis padres.</i></p>"
      "<p>Verkehrsmittel: <b>en</b> avión, en coche, en tren – aber <b>a pie</b>.</p>",
      [
          mc("Mañana ___ a Mallorca en avión.", "Morgen fliege ich nach Mallorca.", ["voy", "va", "vamos", "soy"]),
          mc("¿Qué ___ a hacer mañana?", "Was machst du morgen?", ["vas", "va", "voy", "vais"]),
          mc("¿Qué va ___ hacer Pilar?", "Was wird Pilar machen?", ["a", "de", "en", "—"]),
          mc("Vamos ___ cine.", "Wir gehen ins Kino.", ["al", "a el", "en el", "del"], "a + el = al."),
          mc("Voy a Palma ___ coche.", "Ich fahre mit dem Auto nach Palma.", ["en", "con", "a", "de"]),
          mc("Mis hijos van al colegio ___ pie.", "Meine Kinder gehen zu Fuß zur Schule.", ["a", "en", "de", "con"]),
          ty("ir – nosotros ___", "wir gehen", ["vamos"]),
          ty("ir – ellos ___", "sie gehen", ["van"]),
          od("Ich werde meine Eltern in Granada besuchen.", "Voy a visitar a mis padres en Granada."),
          od("Wohin fährst du an Weihnachten?", "¿Adónde vas a ir en Navidades?"),
      ])

topic("prep", "a, en, de – wohin, wo, woher", [17],
      "<p><b>a</b> = wohin (ir a Madrid) · <b>en</b> = wo / womit (estar en casa, en tren) · <b>de</b> = woher (venir de Roma).</p>"
      "<p>¿Adónde...? – a... · ¿Dónde...? – en... · ¿De dónde...? – de...</p>",
      [])  # Übungen aus der Excel

topic("dem", "Demonstrativa este / ese / aquel", [21],
      "<p><b>este, esta, estos, estas</b> (hier, bei mir) · <b>ese, esa, esos, esas</b> (da, bei dir) · <b>aquel, aquella, aquellos, aquellas</b> (dort). Neutral: <b>esto, eso, aquello</b>.</p>",
      [])  # Übungen kommen aus der Excel (Sheet "Übungen")

topic("adj", "Adjektive angleichen", [6, 27],
      "<p>Adjektive richten sich nach Geschlecht und Zahl: <b>pequeño/pequeña/pequeños/pequeñas</b>.</p>"
      "<p>Auf <b>-e</b> oder Konsonant: nur Plural (grande → grandes, difícil → difíciles). Nationalität: alemán → alemana.</p>",
      [])  # Übungen aus der Excel ergänzt

topic("pos_ort", "Ortsangaben", [22, 23],
      "<p><b>encima de / sobre</b> auf · <b>debajo de</b> unter · <b>delante de</b> vor · <b>detrás de</b> hinter · <b>al lado de</b> neben · "
      "<b>entre ... y ...</b> zwischen · <b>a la derecha / izquierda de</b> rechts/links · <b>dentro / fuera de</b> innen/außen.</p>"
      "<p><b>de + el = del</b>, <b>a + el = al</b>.</p>",
      [])  # aus Excel (Sheet "Übungen Position")

topic("saber", "saber oder poder", [27],
      "<p><b>saber</b> + Infinitiv = etwas gelernt haben / können: <i>¿Sabes hablar inglés? Pilar sabe esquiar.</i></p>"
      "<p><b>poder</b> = können im Sinne von Möglichkeit/Erlaubnis: <i>No puedo, tengo que trabajar. ¿Puedo pasar?</i></p>"
      "<p>sé, sabes, sabe, sabemos, sabéis, saben · puedo, puedes, puede, podemos, podéis, pueden</p>",
      [
          mc("¿___ hablar inglés? – Sí, sé hablar inglés.", "Kannst du Englisch?", ["Sabes", "Puedes", "Conoces", "Sabe"]),
          mc("Hoy no ___ ir, tengo que trabajar.", "Heute kann ich nicht kommen, ich muss arbeiten.", ["puedo", "sé", "sabo", "pudo"]),
          mc("Pilar ___ esquiar muy bien.", "Pilar kann sehr gut Ski fahren.", ["sabe", "puede", "conoce", "es"], "gelernte Fähigkeit → saber."),
          mc("En Sierra Nevada se ___ esquiar.", "In der Sierra Nevada kann man Ski fahren.", ["puede", "sabe", "pueden", "hay"]),
          mc("¿___ abrir la ventana, por favor?", "Kannst du bitte das Fenster öffnen?", ["Puedes", "Sabes", "Sabe", "Podes"]),
          mc("No ___ todavía.", "Ich weiß es noch nicht.", ["sé", "puedo", "sabo", "conozco"]),
          mc("¿___ tocar un instrumento? – Sí, el piano.", "Können Sie ein Instrument spielen?", ["Sabe", "Puede", "Sé", "Toca"]),
          ty("saber – yo ___", "ich weiß", ["sé", "se"]),
          ty("poder – ellos ___", "sie können", ["pueden"]),
      ])

topic("compras", "Einkaufen: ¿Cuánto cuesta?", [20, 21, 26],
      "<p><b>¿Cuánto cuesta</b> + Singular? · <b>¿Cuánto cuestan</b> + Plural? · <b>¿Cuánto es (todo)?</b> · <b>¿Me cobra / me cobras?</b></p>"
      "<p>Bestellen: <b>Quisiera</b> + Sache/Verb, <b>Póngame</b> ..., ¿Algo más? – No, nada más, gracias.</p>",
      [
          mc("¿Cuánto ___ estas naranjas?", "Wie viel kosten diese Orangen?", ["cuestan", "cuesta", "es", "son"]),
          mc("¿Cuánto ___ el pan?", "Wie viel kostet das Brot?", ["cuesta", "cuestan", "costa", "son"]),
          mc("¿Desea algo más? – No, no quiero ___ más.", "Möchten Sie noch etwas? – Nein, nichts mehr.", ["nada", "algo", "nunca", "no"]),
          mc("___ reservar una mesa para dos.", "Ich möchte einen Tisch für zwei reservieren.", ["Quisiera", "Quiere", "Tengo", "Puedo de"]),
          mc("¿Me ___, por favor?", "Kann ich bitte zahlen? (Kassieren Sie?)", ["cobra", "paga", "cuesta", "da"]),
          od("Wie viel macht alles?", "¿Cuánto es todo?"),
          od("Ein Kilo Tomaten, bitte.", "Un kilo de tomates, por favor."),
      ])

topic("tiempo", "Wetter mit hacer", [17],
      "<p><b>Hace</b> buen tiempo / mal tiempo / calor / frío / sol / viento. <b>Llueve</b> (es regnet), <b>está nublado</b>.</p>"
      "<p>¿Qué tiempo hace en Palma?</p>",
      [
          mc("Hoy ___ buen tiempo en Palma.", "Heute ist schönes Wetter in Palma.", ["hace", "es", "está", "hay"]),
          mc("En agosto ___ mucho calor.", "Im August ist es sehr heiß.", ["hace", "es", "tiene", "está"]),
          mc("¿Qué tiempo ___?", "Wie ist das Wetter?", ["hace", "es", "está", "hay"]),
          mc("Hoy ___ nublado.", "Heute ist es bewölkt.", ["está", "hace", "es", "hay"]),
          od("Heute ist schlechtes Wetter.", "Hoy hace mal tiempo."),
      ])

topic("frec", "Häufigkeit", [8, 11, 28],
      "<p><b>siempre</b> immer · <b>casi siempre</b> fast immer · <b>a menudo / con frecuencia</b> oft · <b>a veces / algunas veces</b> manchmal · "
      "<b>casi nunca</b> fast nie · <b>nunca</b> nie.</p><p><b>Nunca</b> vor dem Verb – oder <b>no</b> + Verb + nunca.</p>",
      [
          mc("___ como en casa los lunes.", "Ich esse manchmal montags zu Hause.", ["A veces", "Nunca no", "A vez", "Veces"]),
          mc("No voy ___ al gimnasio.", "Ich gehe nie ins Fitnessstudio.", ["nunca", "siempre", "a veces", "casi"]),
          mc("Mi hermano ___ llega tarde.", "Mein Bruder kommt immer zu spät.", ["siempre", "nunca no", "a menudo de", "veces"]),
          mc("Vamos a la playa ___.", "Wir gehen oft an den Strand.", ["a menudo", "a menos", "en menudo", "de frecuencia"]),
          od("Ich trinke fast nie Kaffee.", "Casi nunca bebo café."),
      ])


topic("conect", "Konnektoren (Satzverbinder)", [28],
      "<p><b>Gegensatz:</b> pero, sin embargo, no obstante (formell), aunque (obwohl), a pesar de + Nomen/Infinitiv (trotz).</p>"
      "<p><b>Grund / Folge:</b> porque, ya que, como (nur am Satzanfang) · así que, por eso, por lo tanto.</p>"
      "<p><b>Erklären / Gliedern:</b> es decir, o sea (umgangssprachlich), de hecho, por un lado … por otro lado, en resumen.</p>"
      "<p><b>Immer mit Subjuntivo:</b> para que, antes de que, a menos que, sin que, con tal de que (kommt später im Kurs).</p>",
      [
          mc("___ llueve, no vamos a la playa.", "Da es regnet, gehen wir nicht an den Strand.", ["Como", "Porque", "Aunque", "Así que"], "Grund am Satzanfang → como."),
          mc("Estoy cansado, ___ me voy a casa.", "Ich bin müde, also gehe ich nach Hause.", ["así que", "aunque", "sin embargo", "a pesar de"]),
          mc("Quiero ir; ___, no tengo tiempo.", "Ich will hingehen; ich habe jedoch keine Zeit.", ["sin embargo", "por lo tanto", "ya que", "es decir"]),
          mc("___ la lluvia, salimos a pasear.", "Trotz des Regens gehen wir spazieren.", ["A pesar de", "Aunque", "Sin embargo", "Como"], "a pesar de + Nomen."),
          mc("___ estoy cansado, voy al gimnasio.", "Obwohl ich müde bin, gehe ich ins Fitnessstudio.", ["Aunque", "A pesar de", "Así que", "Ya que"]),
          mc("No voy a la fiesta ___ tengo que trabajar.", "Ich gehe nicht zur Party, da ich arbeiten muss.", ["ya que", "así que", "aunque", "sin embargo"]),
          mc("Vivo en Palma, ___, en Mallorca.", "Ich wohne in Palma, das heißt auf Mallorca.", ["es decir", "sin embargo", "aunque", "por lo tanto"]),
          mc("___, el viaje fue muy bonito.", "Zusammenfassend war die Reise sehr schön.", ["En resumen", "A menos que", "Sin que", "Aunque"]),
          ty("einerseits = por un ___", "einerseits", ["lado"]),
          od("Andererseits ist es sehr teuer.", "Por otro lado, es muy caro."),
      ])


def main():
    out = Path(__file__).resolve().parent.parent / "data" / "grammar.json"
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from excel_exercises import add_from_excel
    add_from_excel(T)
    n = 0
    import hashlib
    for t in T:
        for it in t["items"]:
            key = json.dumps([it.get("q"), it.get("de"), it.get("ans"), it.get("opts", [None])[0]], ensure_ascii=False)
            it["id"] = t["id"] + "-" + hashlib.sha1(key.encode()).hexdigest()[:8]
            n += 1
    out.write_text(json.dumps({"topics": T}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(T)} Themen, {n} Übungen")


if __name__ == "__main__":
    main()
