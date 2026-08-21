import type { Fixture, Legend, Player, Result, Standing, TimelineItem } from "./types";

/**
 * Demo ma'lumotlar. Backend qo'shilganda bu massivlar o'rniga
 * lib/queries.ts ichidagi funksiyalar bazaga murojaat qiladi.
 */

export const SQUAD: Player[] = [
  { id: 1,  num: 24, name: "Andre Onana",        pos: "GK", posName: "Darvozabon",          country: "Kamerun" },
  { id: 2,  num: 31, name: "Altay Bayindir",     pos: "GK", posName: "Darvozabon",          country: "Turkiya" },
  { id: 3,  num: 20, name: "Diogo Dalot",        pos: "DF", posName: "O'ng himoyachi",      country: "Portugaliya" },
  { id: 4,  num: 19, name: "Leny Yoro",          pos: "DF", posName: "Markaziy himoya",     country: "Fransiya" },
  { id: 5,  num: 6,  name: "Lisandro Martinez",  pos: "DF", posName: "Markaziy himoya",     country: "Argentina" },
  { id: 6,  num: 5,  name: "Harry Maguire",      pos: "DF", posName: "Markaziy himoya",     country: "Angliya" },
  { id: 7,  num: 23, name: "Luke Shaw",          pos: "DF", posName: "Chap himoyachi",      country: "Angliya" },
  { id: 8,  num: 15, name: "Noussair Mazraoui",  pos: "DF", posName: "Qanot himoyachi",     country: "Marokash" },
  { id: 9,  num: 37, name: "Kobbie Mainoo",      pos: "MF", posName: "Markaziy yarim",      country: "Angliya" },
  { id: 10, num: 18, name: "Casemiro",           pos: "MF", posName: "Himoya yarim",        country: "Braziliya" },
  { id: 11, num: 8,  name: "Bruno Fernandes",    pos: "MF", posName: "Kapitan · plemeyker", country: "Portugaliya" },
  { id: 12, num: 14, name: "Christian Eriksen",  pos: "MF", posName: "Markaziy yarim",      country: "Daniya" },
  { id: 13, num: 4,  name: "Manuel Ugarte",      pos: "MF", posName: "Himoya yarim",        country: "Urugvay" },
  { id: 14, num: 7,  name: "Mason Mount",        pos: "MF", posName: "Hujumkor yarim",      country: "Angliya" },
  { id: 15, num: 17, name: "Alejandro Garnacho", pos: "FW", posName: "Chap qanot",          country: "Argentina" },
  { id: 16, num: 10, name: "Marcus Rashford",    pos: "FW", posName: "Hujumchi",            country: "Angliya" },
  { id: 17, num: 11, name: "Joshua Zirkzee",     pos: "FW", posName: "Markaziy hujumchi",   country: "Niderlandiya" },
  { id: 18, num: 9,  name: "Rasmus Hojlund",     pos: "FW", posName: "Markaziy hujumchi",   country: "Daniya" },
];

export const FIXTURES: Fixture[] = [
  { id: 1, date: "24-avgust",  time: "21:30", home: "Manchester United", away: "Arsenal",           comp: "Premer-liga", venue: "Old Trafford" },
  { id: 2, date: "31-avgust",  time: "18:00", home: "Fulham",            away: "Manchester United", comp: "Premer-liga", venue: "Craven Cottage" },
  { id: 3, date: "14-sentabr", time: "22:00", home: "Manchester United", away: "Liverpool",         comp: "Premer-liga", venue: "Old Trafford" },
  { id: 4, date: "21-sentabr", time: "19:30", home: "Manchester City",   away: "Manchester United", comp: "Derbi",       venue: "Etihad" },
  { id: 5, date: "28-sentabr", time: "20:00", home: "Manchester United", away: "Chelsea",           comp: "Premer-liga", venue: "Old Trafford" },
  { id: 6, date: "5-oktabr",   time: "18:30", home: "Newcastle",         away: "Manchester United", comp: "Premer-liga", venue: "St James' Park" },
];

export const RESULTS: Result[] = [
  { id: 1, date: "17-avgust", home: "Manchester United", away: "Brighton",          homeScore: 3, awayScore: 1, comp: "Premer-liga" },
  { id: 2, date: "10-avgust", home: "Everton",           away: "Manchester United", homeScore: 0, awayScore: 2, comp: "Premer-liga" },
  { id: 3, date: "3-avgust",  home: "Manchester United", away: "Tottenham",         homeScore: 1, awayScore: 1, comp: "Premer-liga" },
  { id: 4, date: "27-iyul",   home: "Aston Villa",       away: "Manchester United", homeScore: 2, awayScore: 0, comp: "Premer-liga" },
  { id: 5, date: "20-iyul",   home: "Manchester United", away: "West Ham",          homeScore: 4, awayScore: 0, comp: "Premer-liga" },
];

export const STANDINGS: Standing[] = [
  { pos: 1, team: "Manchester City",   played: 8, won: 6, drawn: 1, lost: 1, gd: "+14", points: 19 },
  { pos: 2, team: "Arsenal",           played: 8, won: 6, drawn: 1, lost: 1, gd: "+11", points: 19 },
  { pos: 3, team: "Liverpool",         played: 8, won: 5, drawn: 2, lost: 1, gd: "+9",  points: 17 },
  { pos: 4, team: "Manchester United", played: 8, won: 5, drawn: 1, lost: 2, gd: "+7",  points: 16, isUnited: true },
  { pos: 5, team: "Chelsea",           played: 8, won: 4, drawn: 3, lost: 1, gd: "+6",  points: 15 },
  { pos: 6, team: "Tottenham",         played: 8, won: 4, drawn: 2, lost: 2, gd: "+5",  points: 14 },
  { pos: 7, team: "Newcastle",         played: 8, won: 4, drawn: 1, lost: 3, gd: "+3",  points: 13 },
  { pos: 8, team: "Aston Villa",       played: 8, won: 3, drawn: 3, lost: 2, gd: "+2",  points: 12 },
];

export const TIMELINE: TimelineItem[] = [
  { year: "1878", title: "Newton Heath LYR tashkil topdi", text: "Temir yo'l ishchilari jamoasi sifatida boshlangan klub keyinchalik butun dunyoni zabt etadi." },
  { year: "1902", title: "Manchester United nomi",         text: "Klub bankrotlikdan qutqarildi va yangi nom hamda qizil-oq ranglarni oldi." },
  { year: "1958", title: "Myunxen fojiasi",                text: "Samolyot halokatida «Basbi bolalari»ning ko'p qismi halok bo'ldi. Klub tarixidagi eng og'ir kun." },
  { year: "1968", title: "Birinchi Yevropa kubogi",        text: "Bobbi Charlton va Jorj Best bilan United Yevropa kubogini qo'lga kiritgan birinchi ingliz klubi bo'ldi." },
  { year: "1986", title: "Ser Aleks Ferguson keldi",       text: "26 yil davom etgan va 38 ta trofey keltirgan buyuk davr boshlandi." },
  { year: "1999", title: "Trebl — uch tojli mavsum",       text: "Premer-liga, FA Kubogi va Chempionlar ligasi. Nou Kampdagi 2 daqiqa abadiy esda qoladi." },
  { year: "2008", title: "Moskvada Chempionlar ligasi",    text: "Luzhniki stadionida Chelsea ustidan penaltilarda g'alaba — Ronaldu davri cho'qqisi." },
  { year: "2013", title: "20-chempionlik",                 text: "Ser Aleks Fergusonning so'nggi mavsumi. Angliyadagi eng ko'p chempionlik rekordi." },
  { year: "Bugun", title: "Yangi avlod",                   text: "Akademiya iste'dodlari va yosh yulduzlar bilan klub yangi cho'qqilarga tayyorlanmoqda." },
];

export const LEGENDS: Legend[] = [
  { init: "SAF", name: "Ser Aleks Ferguson", role: "Bosh murabbiy",   text: "26 yil, 38 trofey. Klubni dunyodagi eng buyuk brendga aylantirgan inson.",      img: "/legends/ferguson.jpg" },
  { init: "BC",  name: "Ser Bobbi Charlton", role: "Yarim himoyachi", text: "Myunxendan omon qolgan, 1966-yilgi jahon chempioni va klub ramzi.",             img: "/legends/charlton.jpg" },
  { init: "GB",  name: "Jorj Best",          role: "Qanot",           text: "Futbolning birinchi superyulduzi. Beshinchi Bitl deb atalgan.",                 img: "/legends/best.jpg" },
  { init: "EC",  name: "Erik Kantona",       role: "Hujumchi",        text: "Yoqasi ko'tarilgan qirol. Chempionlik ruhini olib kelgan fransuz.",             img: "/legends/cantona.jpg" },
  { init: "RG",  name: "Rayan Gigs",         role: "Qanot",           text: "963 o'yin — klub rekordi. 13 marta Angliya chempioni.",                         img: "/legends/giggs.jpg" },
  { init: "PS",  name: "Pol Skoulz",         role: "Yarim himoyachi", text: "Zidan «eng kuchli raqibim» degan uzatishlar ustasi.",                           img: "/legends/scholes.jpg" },
  { init: "CR7", name: "Kristiano Ronaldu",  role: "Hujumchi",        text: "Madeyra yigitchasi Old Traffordda Oltin to'pgacha o'sdi.",                      img: "/legends/ronaldo.jpg" },
  { init: "WR",  name: "Ueyn Runi",          role: "Hujumchi",        text: "253 gol — klub tarixidagi eng ko'p gol urgan futbolchi.",                       img: "/legends/rooney.jpg" },
];

export const MU = "Manchester United";
