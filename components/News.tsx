const ITEMS = [
  { tag: "Fan-klub", tagClass: "tag--red", big: true, img: 1,
    title: "Toshkentda birgalikda o'yin tomoshasi",
    text: "Har bir derbi o'yinida biz Toshkent markazidagi sport-barda yig'ilamiz. Sharf, ashula va 300 nafar qizil yurak.",
    date: "Har hafta · Toshkent" },
  { tag: "Akademiya", tagClass: "", big: false, img: 2,
    title: "Yoshlar akademiyasidan yangi iste'dodlar",
    text: "Carrington maydonlarida o'sgan navbatdagi avlod birinchi jamoaga yo'l oldi.",
    date: "Old Trafford" },
  { tag: "Transfer", tagClass: "", big: false, img: 3,
    title: "Transfer oynasi: nimalarni kutamiz",
    text: "Yarim mudofaa va hujum chizig'ini kuchaytirish — jamoaning asosiy vazifasi.",
    date: "Tahlil" },
  { tag: "Tarix", tagClass: "tag--gold", big: false, img: 4,
    title: "1999 — uchlik g'alaba tarixi",
    text: "Premer-liga, FA Kubogi va Chempionlar ligasi. Futbol tarixidagi eng buyuk mavsum.",
    date: "Retro" },
];

export default function News() {
  return (
    <section className="section" id="news">
      <div className="container">
        <div className="section__head reveal">
          <h2 className="section__title">Yangiliklar</h2>
          <p className="section__sub">
            Klub hayotidan so'nggi xabarlar va fan-klub e'lonlari
          </p>
        </div>

        <div className="news-grid">
          {ITEMS.map((n) => (
            <article key={n.title} className={`news${n.big ? " news--big" : ""} reveal`}>
              <div className={`news__img news__img--${n.img}`} />
              <div className="news__body">
                <span className={`tag ${n.tagClass}`}>{n.tag}</span>
                <h3>{n.title}</h3>
                <p>{n.text}</p>
                <span className="news__date">{n.date}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
