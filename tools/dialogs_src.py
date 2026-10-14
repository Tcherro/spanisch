#!/usr/bin/env python3
"""Dialoge fürs Sprechtraining. A = Gegenüber (wird vorgelesen), B = du (sprichst selbst).
Erzeugt data/dialogs.json. Neue Szenen unten anhängen."""
import json
from pathlib import Path

D = []


def scene(id, title, lessons, setting, lines, claude):
    D.append({"id": id, "title": title, "lessons": lessons, "setting": setting,
              "lines": [{"w": w, "es": es, "de": de} for w, es, de in lines], "claude": claude})


scene("bar", "En el bar", [1, 10, 11],
      "Du bestellst in einer Bar in Palma Frühstück.",
      [
          ("A", "¡Buenos días! ¿Qué le pongo?", "Guten Morgen! Was darf ich Ihnen bringen?"),
          ("B", "Buenos días. Un café con leche y una tostada con tomate, por favor.", "Guten Morgen. Einen Milchkaffee und ein Toast mit Tomate, bitte."),
          ("A", "¿Algo más?", "Noch etwas?"),
          ("B", "Sí, un zumo de naranja. ¿Tienen zumo natural?", "Ja, einen Orangensaft. Haben Sie frisch gepressten Saft?"),
          ("A", "Sí, claro. ¿Para tomar aquí o para llevar?", "Ja, klar. Zum Hiertrinken oder zum Mitnehmen?"),
          ("B", "Para tomar aquí, en la terraza.", "Zum Hiertrinken, auf der Terrasse."),
          ("A", "Muy bien. Ahora mismo se lo llevo.", "Sehr gut. Ich bringe es Ihnen sofort."),
          ("B", "Perdone, ¿me cobra? ¿Cuánto es todo?", "Entschuldigung, kann ich zahlen? Wie viel macht alles?"),
          ("A", "Son seis euros con cincuenta.", "Das macht sechs Euro fünfzig."),
          ("B", "Aquí tiene. ¡Gracias, hasta luego!", "Bitte schön. Danke, bis später!"),
      ],
      "Rollenspiel in einer Bar in Palma: Du bist der Kellner, ich bestelle Frühstück und zahle.")

scene("mercado", "En el mercado", [20, 21, 26],
      "Du kaufst auf dem Mercat de l'Olivar Obst ein.",
      [
          ("A", "¡Hola! ¿Qué le pongo?", "Hallo! Was darf es sein?"),
          ("B", "Hola. ¿Cuánto cuestan estas naranjas?", "Hallo. Wie viel kosten diese Orangen?"),
          ("A", "Dos euros el kilo.", "Zwei Euro das Kilo."),
          ("B", "Póngame dos kilos, por favor. ¿Y esos tomates?", "Geben Sie mir bitte zwei Kilo. Und die Tomaten da?"),
          ("A", "Esos son de Mallorca, a tres euros el kilo.", "Die sind aus Mallorca, drei Euro das Kilo."),
          ("B", "Quisiera medio kilo de esos tomates.", "Ich hätte gern ein halbes Kilo von diesen Tomaten."),
          ("A", "Aquí tiene. ¿Desea algo más?", "Bitte. Möchten Sie noch etwas?"),
          ("B", "No, nada más, gracias. ¿Cuánto es todo?", "Nein, nichts mehr, danke. Wie viel macht alles?"),
          ("A", "Cinco euros con cincuenta.", "Fünf Euro fünfzig."),
          ("B", "¿Puedo pagar con tarjeta?", "Kann ich mit Karte zahlen?"),
      ],
      "Rollenspiel auf dem Markt in Palma: Du bist Marktverkäufer, ich kaufe Obst und Gemüse und frage nach Preisen (este/ese/aquel).")

scene("calle", "En la calle", [2, 7, 22],
      "Du suchst in der Stadt eine Apotheke.",
      [
          ("B", "¡Perdone! ¿Hay una farmacia cerca de aquí?", "Entschuldigung! Gibt es hier in der Nähe eine Apotheke?"),
          ("A", "Sí, hay una en esta calle, al lado del banco.", "Ja, es gibt eine in dieser Straße, neben der Bank."),
          ("B", "¿Está lejos?", "Ist es weit?"),
          ("A", "No, está muy cerca. Todo recto y en el próximo semáforo, a la derecha.", "Nein, ganz nah. Geradeaus und an der nächsten Ampel rechts."),
          ("B", "¿Sabe a qué hora cierra?", "Wissen Sie, wann sie schließt?"),
          ("A", "Creo que cierra a las ocho y media.", "Ich glaube, sie schließt um halb neun."),
          ("B", "Muchas gracias, muy amable.", "Vielen Dank, sehr freundlich."),
          ("A", "De nada. ¡Que se mejore!", "Gern geschehen. Gute Besserung!"),
      ],
      "Rollenspiel: Ich frage dich auf der Straße in Palma nach dem Weg zur Apotheke, zur Bank und zum Bus. Nutze Ortsangaben (al lado de, delante de, a la derecha).")

scene("presentarse", "Presentarse", [2, 5, 18],
      "Du stellst dich auf einem Fest einer Spanierin vor.",
      [
          ("A", "Hola, ¿cómo te llamas?", "Hallo, wie heißt du?"),
          ("B", "Me llamo Christian. Encantado.", "Ich heiße Christian. Freut mich."),
          ("A", "Encantada. ¿De dónde eres?", "Freut mich. Woher kommst du?"),
          ("B", "Soy alemán, de Dortmund, pero vivo en Mallorca.", "Ich bin Deutscher, aus Dortmund, aber ich lebe auf Mallorca."),
          ("A", "¡Qué bien! ¿Y a qué te dedicas?", "Wie schön! Und was machst du beruflich?"),
          ("B", "Soy consultor y empresario. Trabajo mucho con empresas alemanas.", "Ich bin Berater und Unternehmer. Ich arbeite viel mit deutschen Firmen."),
          ("A", "¿Tienes familia aquí?", "Hast du Familie hier?"),
          ("B", "Sí, estoy casado y tenemos dos hijos, un niño y una niña.", "Ja, ich bin verheiratet und wir haben zwei Kinder, einen Jungen und ein Mädchen."),
          ("A", "¿Y hablas español?", "Und sprichst du Spanisch?"),
          ("B", "Un poco. Estudio español con una profesora dos veces por semana.", "Ein bisschen. Ich lerne zweimal pro Woche Spanisch mit einer Lehrerin."),
      ],
      "Small Talk auf einer Feier: Du bist eine Spanierin aus Palma und fragst mich nach Herkunft, Beruf und Familie (ser, estar, tener, Possessiva).")

scene("hora", "¿A qué hora?", [12, 13, 16],
      "Du klärst Öffnungszeiten und einen Termin.",
      [
          ("B", "Perdone, ¿qué hora es?", "Entschuldigung, wie spät ist es?"),
          ("A", "Son las diez y cuarto.", "Es ist Viertel nach zehn."),
          ("B", "¿Sabe a qué hora abren las tiendas en España?", "Wissen Sie, wann die Läden in Spanien öffnen?"),
          ("A", "Normalmente abren a las diez y cierran a las dos. Por la tarde abren de cinco a nueve.", "Normalerweise öffnen sie um zehn und schließen um zwei. Nachmittags haben sie von fünf bis neun geöffnet."),
          ("B", "¿Y el supermercado?", "Und der Supermarkt?"),
          ("A", "El horario de los supermercados es de ocho y media a nueve y media de la noche.", "Supermärkte haben von halb neun bis halb zehn abends geöffnet."),
          ("B", "Perfecto. Mañana voy temprano.", "Perfekt. Morgen gehe ich früh."),
      ],
      "Übe mit mir Uhrzeiten und Öffnungszeiten: Frag mich nach meinem Tagesablauf und wann Läden, Schule und Büro öffnen.")

scene("rutina", "Mi rutina", [15, 16],
      "Eine Freundin fragt nach deinem Tagesablauf.",
      [
          ("A", "¿A qué hora te levantas normalmente?", "Wann stehst du normalerweise auf?"),
          ("B", "Me levanto a las siete y me ducho.", "Ich stehe um sieben auf und dusche."),
          ("A", "¿Y desayunas en casa?", "Und frühstückst du zu Hause?"),
          ("B", "Sí, desayuno con mis hijos y después los llevo al colegio.", "Ja, ich frühstücke mit meinen Kindern und bringe sie dann zur Schule."),
          ("A", "¿A qué hora empiezas a trabajar?", "Wann fängst du an zu arbeiten?"),
          ("B", "Empiezo a las nueve. Almuerzo a las dos.", "Ich fange um neun an. Mittag esse ich um zwei."),
          ("A", "¿Y por la tarde?", "Und am Nachmittag?"),
          ("B", "Por la tarde recojo a los niños y a veces voy a la playa.", "Nachmittags hole ich die Kinder ab und manchmal gehe ich an den Strand."),
          ("A", "¿Y a qué hora te acuestas?", "Und wann gehst du ins Bett?"),
          ("B", "Me acuesto a las once, más o menos.", "Ich gehe ungefähr um elf ins Bett."),
      ],
      "Frag mich ausführlich nach meinem Tagesablauf (reflexive Verben, Uhrzeiten, Stammwechsel: empiezo, almuerzo, me acuesto).")

scene("viaje", "En el aeropuerto", [16, 17],
      "Du holst jemanden am Flughafen Palma ab.",
      [
          ("B", "Perdone, ¿a qué hora llega el avión de Dortmund?", "Entschuldigung, wann landet das Flugzeug aus Dortmund?"),
          ("A", "Llega a las once y veinte, a la puerta B.", "Es landet um elf Uhr zwanzig, an Ausgang B."),
          ("B", "¿Dónde están las llegadas?", "Wo ist die Ankunft?"),
          ("A", "Abajo, a la izquierda. Las salidas están arriba.", "Unten links. Die Abflüge sind oben."),
          ("B", "Gracias. ¿Y dónde hay un taxi?", "Danke. Und wo gibt es ein Taxi?"),
          ("A", "Los taxis están delante de la salida.", "Die Taxis stehen vor dem Ausgang."),
          ("B", "Muy bien. Mañana vuelo a Alemania, ¿a qué hora tengo que estar aquí?", "Sehr gut. Morgen fliege ich nach Deutschland, wann muss ich hier sein?"),
          ("A", "Dos horas antes del vuelo, más o menos.", "Ungefähr zwei Stunden vor dem Flug."),
      ],
      "Rollenspiel am Flughafen Palma: Ich hole jemanden ab und plane meinen eigenen Flug nach Deutschland (ir, volar, llegar, a qué hora).")

scene("planes", "Planes para el fin de semana", [17, 27],
      "Ihr verabredet euch fürs Wochenende.",
      [
          ("A", "¿Qué vas a hacer este fin de semana?", "Was machst du dieses Wochenende?"),
          ("B", "El sábado voy a ir a la playa con mi familia.", "Am Samstag gehe ich mit meiner Familie an den Strand."),
          ("A", "¿Y el domingo? ¿Vamos al cine?", "Und am Sonntag? Gehen wir ins Kino?"),
          ("B", "Lo siento, el domingo no puedo. Tengo que trabajar.", "Tut mir leid, am Sonntag kann ich nicht. Ich muss arbeiten."),
          ("A", "¡Qué pena! ¿Tienes ganas de hacer una excursión el sábado por la tarde?", "Schade! Hast du Lust, am Samstagnachmittag einen Ausflug zu machen?"),
          ("B", "Sí, tengo muchas ganas. ¿Adónde vamos?", "Ja, große Lust. Wohin fahren wir?"),
          ("A", "A Valldemossa. ¿Sabes conducir por la montaña?", "Nach Valldemossa. Kannst du in den Bergen fahren?"),
          ("B", "Sí, sé conducir, pero voy en coche despacio.", "Ja, ich kann fahren, aber ich fahre langsam."),
          ("A", "¡Perfecto! Si hace buen tiempo, vamos a comer allí.", "Perfekt! Wenn das Wetter schön ist, essen wir dort."),
      ],
      "Verabrede dich mit mir fürs Wochenende auf Mallorca (ir a + Infinitiv, poder vs. saber, tener ganas de, Wetter mit hacer).")

scene("restaurante", "Reservar una mesa", [1, 3],
      "Du reservierst telefonisch einen Tisch.",
      [
          ("A", "Restaurante Es Mollet, ¿dígame?", "Restaurant Es Mollet, ja bitte?"),
          ("B", "Buenas tardes. Quisiera reservar una mesa para cuatro personas.", "Guten Tag. Ich möchte einen Tisch für vier Personen reservieren."),
          ("A", "¿Para qué día?", "Für welchen Tag?"),
          ("B", "Para el sábado, a las nueve de la noche.", "Für Samstag, um neun Uhr abends."),
          ("A", "Muy bien. ¿Dentro o en la terraza?", "Sehr gut. Drinnen oder auf der Terrasse?"),
          ("B", "En la terraza, por favor. Somos dos adultos y dos niños.", "Auf der Terrasse, bitte. Wir sind zwei Erwachsene und zwei Kinder."),
          ("A", "¿A nombre de quién?", "Auf welchen Namen?"),
          ("B", "A nombre de Christian. Se escribe C-H-R-I-S-T-I-A-N.", "Auf den Namen Christian. Man schreibt C-H-R-I-S-T-I-A-N."),
          ("A", "Perfecto, hasta el sábado.", "Perfekt, bis Samstag."),
      ],
      "Rollenspiel: Ich reserviere telefonisch einen Tisch und bestelle danach im Restaurant (quisiera, Zahlen, Uhrzeit, Buchstabieren).")

scene("bautizo", "El bautizo", [27],
      "Du erzählst von einer Taufe in der Familie.",
      [
          ("A", "¿Qué tal el fin de semana?", "Wie war das Wochenende?"),
          ("B", "Muy bien. El domingo tenemos el bautizo de mi sobrina.", "Sehr gut. Am Sonntag haben wir die Taufe meiner Nichte."),
          ("A", "¡Qué bonito! ¿Dónde es?", "Wie schön! Wo ist sie?"),
          ("B", "Es en una iglesia en Palma. El cura es muy simpático.", "In einer Kirche in Palma. Der Pfarrer ist sehr sympathisch."),
          ("A", "¿Y quiénes son los padrinos?", "Und wer sind die Paten?"),
          ("B", "Los padrinos son mi cuñado y una amiga de mi mujer.", "Die Paten sind mein Schwager und eine Freundin meiner Frau."),
          ("A", "¿Viene la familia de Alemania?", "Kommt die Familie aus Deutschland?"),
          ("B", "Sí, mis padres vuelan de Dortmund el viernes.", "Ja, meine Eltern fliegen am Freitag aus Dortmund."),
      ],
      "Frag mich nach einem Familienfest (Taufe) und meiner Familie (Possessiva, Familienwortschatz, ser/estar).")

scene("tiempo", "¿Qué tiempo hace?", [17],
      "Ein Telefonat mit Deutschland übers Wetter.",
      [
          ("A", "¿Qué tiempo hace en Mallorca?", "Wie ist das Wetter auf Mallorca?"),
          ("B", "Hace muy buen tiempo. Hace sol y hace calor.", "Sehr schönes Wetter. Es ist sonnig und warm."),
          ("A", "Aquí en Alemania hace frío y llueve mucho.", "Hier in Deutschland ist es kalt und es regnet viel."),
          ("B", "¡Qué pena! ¿Por qué no venís a Mallorca?", "Wie schade! Warum kommt ihr nicht nach Mallorca?"),
          ("A", "Buena idea. ¿Cuándo es mejor?", "Gute Idee. Wann ist es am besten?"),
          ("B", "En mayo o en septiembre. No hace tanto calor.", "Im Mai oder im September. Da ist es nicht so heiß."),
      ],
      "Unterhalte dich mit mir übers Wetter auf Mallorca und in Deutschland (hace, Monate, Jahreszeiten).")


def main():
    out = Path(__file__).resolve().parent.parent / "data" / "dialogs.json"
    out.write_text(json.dumps({"scenes": D}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(len(D), "Szenen,", sum(len(s["lines"]) for s in D), "Zeilen")


if __name__ == "__main__":
    main()
