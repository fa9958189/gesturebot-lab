import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import guideVisual from '../../public/gesturebot-control-visual-v1.png';
import styles from './guide.module.css';

export const metadata: Metadata = {
  title: 'Guia de controle — GestureBot Lab',
  description: 'Veja qual dedo controla cada articulação do GestureBot.',
};

const controls = [
  { number: '01', finger: 'Polegar', target: 'Perna esquerda', instruction: 'Dobre para mover quadril e joelho.', tone: 'lime' },
  { number: '02', finger: 'Indicador', target: 'Braço esquerdo', instruction: 'Dobre para levantar o ombro e o cotovelo.', tone: 'amber' },
  { number: '03', finger: 'Médio', target: 'Cabeça', instruction: 'Mova para os lados e dobre para olhar acima/abaixo.', tone: 'cyan' },
  { number: '04', finger: 'Anelar', target: 'Braço direito', instruction: 'Dobre para levantar o ombro e o cotovelo.', tone: 'amber' },
  { number: '05', finger: 'Mínimo', target: 'Perna direita', instruction: 'Dobre para mover quadril e joelho.', tone: 'lime' },
] as const;

export default function GuidePage() {
  return (
    <main className={styles.page}>
      <article className={styles.poster}>
        <header className={styles.header}>
          <Link href="/" className={styles.back}>← Voltar ao controle</Link>
          <p>GestureBot Lab · Guia rápido</p>
          <h1>Uma mão.<br /><span>Cinco movimentos.</span></h1>
          <p className={styles.lead}>Mostre a palma inteira e dobre um dedo de cada vez. Um movimento curto já é suficiente.</p>
        </header>

        <section className={styles.visual} aria-label="Mão conectada às articulações do robô">
          <Image
            src={guideVisual}
            alt="Uma mão rastreada conectada à cabeça, braços e pernas do GestureBot"
            fill
            priority
            sizes="(max-width: 760px) 100vw, 760px"
          />
        </section>

        <section className={styles.controls} aria-label="Mapa dos dedos">
          {controls.map((control) => (
            <article className={`${styles.control} ${styles[control.tone]}`} key={control.number}>
              <span className={styles.number}>{control.number}</span>
              <div>
                <p>{control.finger}</p>
                <h2>{control.target}</h2>
                <span>{control.instruction}</span>
              </div>
            </article>
          ))}
        </section>

        <footer className={styles.footer}>
          <div><strong>1</strong><span>Deixe a mão a 40–80 cm da câmera.</span></div>
          <div><strong>2</strong><span>Mantenha pulso e pontas dos dedos visíveis.</span></div>
          <div><strong>3</strong><span>Dobre devagar no início e depois aumente a velocidade.</span></div>
        </footer>
      </article>
    </main>
  );
}
