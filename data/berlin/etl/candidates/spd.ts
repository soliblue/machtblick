import { bezirksliste } from './createCandidates'

const sourceUrl = 'https://spd.berlin/kandidatinnen/'

export const spdCandidates = [
  ...bezirksliste('spd', 'Mitte', sourceUrl, [
    'Mathias Schulz',
    'Dr. Maja Lasić',
    'Lucy Merle Demers',
    'Federico Quadrelli',
    'Susanne Fischer',
    'Marion Blacher-Schwake'
  ]),
  ...bezirksliste('spd', 'Friedrichshain-Kreuzberg', sourceUrl, [
    'Sevim Aydin',
    'Sven Heinemann',
    'Britt Schlünz',
    'Thomas Giebel',
    'Dora Oswald',
    'Steffen Opitz'
  ]),
  ...bezirksliste('spd', 'Pankow', sourceUrl, [
    'Rona Tietje',
    'Dennis Buchner',
    'Annette Unger',
    'Tino Schopf',
    'Linda Vierecke',
    'Torsten Hofer',
    'Arne Gröschel',
    'Katja Ahrens',
    'Paul Krüger',
    'Birgit Mickley',
    'Heiko Kretschmer'
  ]),
  ...bezirksliste('spd', 'Charlottenburg-Wilmersdorf', sourceUrl, [
    'Florian Dörstelmann',
    'Dr. Ann-Kathrin Biewener',
    'Timur Sarić',
    'Dr. Claudia Buß',
    'Nico Kaufmann',
    'Ülker Radziwill',
    'Christian Hochgrebe',
    'Kristina Göllner',
    'Johannes Gamer',
    'Dr. Kabeh Führ-Hosseini',
    'Clemens Brandt',
    'Julia Selge'
  ]),
  ...bezirksliste('spd', 'Spandau', sourceUrl, [
    'Raed Saleh',
    'Sebahat Atli',
    'Stephan Machulik',
    'Susanne Drescher',
    'Marco Rumza',
    'Miloslava Büger',
    'Michael Stobbe',
    'Dagmar Brückmann'
  ]),
  ...bezirksliste('spd', 'Steglitz-Zehlendorf', sourceUrl, [
    'Steffen Krach',
    'Dr. Ina Czyborra',
    'Martin Matz',
    'Mirjam Golm',
    'Norbert Buchta',
    'Carolyn Macmillan',
    'Andreas Linde',
    'Franziska Grün',
    'Matthias Trenczek',
    'Sarah Maurer',
    'Patrik John',
    'Esra Kosan',
    'Matthias Kollatz'
  ]),
  ...bezirksliste('spd', 'Tempelhof-Schöneberg', sourceUrl, [
    'Wiebke Neumann',
    'Orkan Özdemir',
    'Melanie Kühnemann-Grunow',
    'Michael Biel',
    'Annette Hertlein',
    'Sebastian Schlüsselburg',
    'Kari Lenke',
    'Oliver Schworck'
  ]),
  ...bezirksliste('spd', 'Neukölln', sourceUrl, [
    'Derya Çağlar',
    'Marcel Hopp',
    'Charlotte Mende',
    'Joachim Rahmann',
    'Anne Roever',
    'Akilnathan Logeswaran',
    'Ines Woithe'
  ]),
  ...bezirksliste('spd', 'Treptow-Köpenick', sourceUrl, [
    'Julia Dittmar',
    'Alexander Freier-Winterwerb',
    'Ellen Haußdörfer',
    'Paul Bahlmann',
    'Sara Rüdiger',
    'Lars Düsterhöft',
    'Katharina Jahn-Günther',
    'Asya Aldiri'
  ]),
  ...bezirksliste('spd', 'Marzahn-Hellersdorf', sourceUrl, [
    'Iris Spranger',
    'Jan Lehmann',
    'Dr. Luise Lehmann',
    'Enrico Bloch',
    'Maria Geidel',
    'Eike Arnold'
  ]),
  ...bezirksliste('spd', 'Lichtenberg', sourceUrl, [
    'Tamara Lüdke',
    'Marlon Bünck',
    'Marie Scharfenberg',
    'Uwe Heinecke',
    'Stefan Schenck'
  ]),
  ...bezirksliste('spd', 'Reinickendorf', sourceUrl, [
    'Bettina König',
    'Sven Meyer',
    'Laurence Stroedter',
    'Kai Kottenstede',
    'Sevda Boyraci',
    'Samuel Märkt',
    'Hayal Düz',
    'Sascha Rudloff',
    'Angela Budweg',
    'Kán Lindner',
    'Nicole Borkenhagen',
    'Darrell Kanngießer'
  ])
]
