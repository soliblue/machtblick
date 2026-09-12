export const REVIEWED_PIN = [
  335476,
  {
    "drucksache": "21/6585",
    "deSourceHash": "a0d7776bfff296484dbc6f7e3241906bcd247938a1d42c267ce797cc9e481d5d",
    "de": {
      "summary_detail": "## Was sich ändern soll\n\n* Das BSI soll Protokolldaten und an den Schnittstellen der Kommunikationstechnik des Bundes anfallende Daten, die als Zeichenfolge auf eine Internetressource verweisen, unter den gesetzlichen Voraussetzungen bis zu **18 Monate** speichern dürfen. Die Auswertung dieser gespeicherten Daten muss automatisiert erfolgen. Eine nicht automatisierte Verarbeitung ist nur in den gesetzlich geregelten Ausnahmefällen zulässig. Auf Daten, die länger als drei Monate gespeichert sind, darf nur bei tatsächlichen Erkenntnissen über eine Betroffenheit des Bundes zugegriffen werden.\n* Das BSI soll bei Bundesbehörden sowie besonders wichtigen und wichtigen Einrichtungen nach Sicherheitsproblemen suchen und betroffene IT Systeme wiederherstellen können. Dies gilt auf Ersuchen der betroffenen Einrichtung, des Betreibers oder einer zuständigen Behörde.\n* Anbieter öffentlich zugänglicher Telekommunikationsdienste und geschäftsmäßige Anbieter digitaler Dienste sollen dem BSI auf Verlangen vorhandene sicherheitsrelevante technische Informationen bereitstellen, soweit sie technisch dazu in der Lage sind und dies wirtschaftlich zumutbar ist.\n* BKA und Bundespolizei sollen den Betrieb gefährlicher IT Systeme untersagen, schädlichen Datenverkehr umleiten, einschränken oder stoppen sowie mit einem Angriff verbundene Daten auslesen, löschen oder verändern dürfen.\n* Eingriffe in private IT Systeme ohne Einwilligung sollen nur zur Abwehr dringender Gefahren für besonders wichtige Schutzgüter zulässig sein. Dafür ist grundsätzlich eine gerichtliche Anordnung erforderlich. Bei Gefahr im Verzug muss die gerichtliche Entscheidung unverzüglich nachgeholt werden. Erfolgt die Bestätigung nicht innerhalb von **3 Tagen**, tritt die Anordnung außer Kraft.\n* Die Bundespolizei soll diese Befugnisse bei ihren Aufgaben zur Gefahrenabwehr erhalten, nicht bei der Strafverfolgung. Das BKA soll sie für bestehende Aufgaben der Gefahrenabwehr und für neue Aufgaben zur Abwehr von Angriffen auf die IT Sicherheit erhalten.\n* Für Bürgerinnen und Bürger soll kein zusätzlicher Erfüllungsaufwand entstehen. Für die Wirtschaft werden etwa **10 Millionen Euro** jährlich und **4,4 Millionen Euro** einmalig erwartet. Für die Bundesverwaltung werden **35 Millionen Euro** jährlich und **19,61 Millionen Euro** einmalig erwartet.\n\n## Hintergrund\n\nCyberangriffe nehmen nach Darstellung der Bundesregierung an Zahl und Wirkung zu. Besonders Angriffe auf kritische Infrastruktur, Unternehmen und staatliche Stellen können das öffentliche Leben, die Wirtschaft und die Verwaltung schwer beeinträchtigen. Vorbeugender Schutz in den eigenen IT Systemen reiche bei großen Angriffen nicht immer aus. Deshalb sollen Erkennung, Abwehr und Wiederherstellung ausgebaut und dafür klarere gesetzliche Grundlagen geschaffen werden."
    },
    "enSourceHash": "3f7e71e7389e59b8e64d6603db2ec8b9893ab55dcfbc5266e1a697f951a25e65",
    "en": {
      "summary_detail": "## What is to change\n\n* The BSI would be permitted to store log data and data arising at federal communications-technology interfaces that consist of strings referring to an internet resource for up to **18 months**, subject to the statutory conditions. These stored data would have to be evaluated by automated means. Non-automated processing would be permitted only in the exceptions specified by law. Data stored for longer than three months could be accessed only if there is concrete evidence that the federal government is affected.\n* The BSI would be able to identify security problems at federal authorities and particularly important and important entities and restore affected IT systems. This would apply at the request of the affected entity, the operator, or a competent authority.\n* Providers of publicly available telecommunications services and commercial providers of digital services would have to provide the BSI, upon request, with existing security-related technical information, insofar as they are technically able to do so and this is economically reasonable.\n* The BKA and the Federal Police would be permitted to prohibit the operation of dangerous IT systems, redirect, restrict, or stop malicious data traffic, and read, delete, or modify data connected to an attack.\n* Interventions in private IT systems without consent would be permitted only to avert imminent threats to particularly important protected interests. A court order would generally be required. In urgent cases, the court decision would have to be obtained without delay. If confirmation is not granted within **3 days**, the order would cease to have effect.\n* The Federal Police would receive these powers for its responsibilities in averting threats, but not for criminal prosecution. The BKA would receive them for its existing responsibilities in averting threats and for new responsibilities involving the prevention of attacks on IT security.\n* Citizens would face no additional compliance costs. Annual costs of approximately **10 million euros** and one-time costs of **4.4 million euros** are expected for businesses. Annual costs of **35 million euros** and one-time costs of **19.61 million euros** are expected for the federal administration.\n\n## Background\n\nAccording to the Federal Government, cyberattacks are increasing in number and impact. Attacks on critical infrastructure, businesses, and government bodies in particular can severely disrupt public life, the economy, and public administration. Preventive protection within an organization's own IT systems is not always sufficient against major attacks. Detection, defense, and recovery capabilities are therefore to be expanded, with clearer legal foundations established for them."
    }
  }
]

export const REVIEWED_GUIDANCE = [
  335476,
  {
    "drucksache": "21/6585",
    "sourceHash": "a0d7776bfff296484dbc6f7e3241906bcd247938a1d42c267ce797cc9e481d5d",
    "de": {
      "summary_detail": {
        "required": [
          "Protokolldaten und an den Schnittstellen der Kommunikationstechnik des Bundes anfallende Daten, die als Zeichenfolge auf eine Internetressource verweisen",
          "Die Auswertung dieser gespeicherten Daten muss automatisiert erfolgen.",
          "Eine nicht automatisierte Verarbeitung ist nur in den gesetzlich geregelten Ausnahmefällen zulässig."
        ],
        "forbidden": [
          "Das BSI soll Daten zur Erkennung bestimmter Gefahren unter konkreten Voraussetzungen bis zu **18 Monate** speichern dürfen."
        ]
      }
    },
    "en": {
      "summary_detail": {
        "required": [
          "log data and data arising at federal communications-technology interfaces that consist of strings referring to an internet resource",
          "These stored data would have to be evaluated by automated means.",
          "Non-automated processing would be permitted only in the exceptions specified by law."
        ],
        "forbidden": [
          "The BSI would be permitted to store data used to detect certain threats for up to **18 months**, subject to specific conditions."
        ]
      }
    }
  }
]
