# La Bottega della Gina — sito web

Sito vetrina per una bottega di pasta fresca a Verona. Statico, nessun framework, nessun build step: si apre e si modifica direttamente.

## Stack
- HTML puro (`index.html`, `menu.html`) + CSS + JS vanilla
- GSAP + ScrollTrigger via CDN per le animazioni (script tag in fondo a ogni HTML)
- Font: Playfair Display (titoli) + Karla (corpo), da Google Fonts
- Nessun bundler, nessun npm — si serve con un semplice server statico (`python3 -m http.server 8080` dentro `bottega-della-gina/`)

## Struttura file
```
index.html              → home page (one-page: hero, storia, menu bento, barattolino, galleria, dove-siamo, newsletter)
menu.html               → pagina menù completo con prezzi reali (Barattolino da Passeggio + Pasta da asporto)
assets/css/tokens.css   → design tokens (colori, spaziature, font, radius, ombre) — variabili CSS in :root
assets/css/style.css    → tutto lo stile delle sezioni/componenti, mobile-first + breakpoint 768/1024/1440
assets/css/premium.css  → effetti "premium": hero cinematico, reveal storia, bottoni magnetici
assets/js/i18n.js       → dizionario IT/EN, tutti i testi tradotti passano da qui (attributo data-i18n nell'HTML)
assets/js/main.js       → nav mobile, smooth scroll, lightbox galleria, form newsletter, reveal-on-scroll generico
assets/js/premium.js    → hero entrance animato, reveal storia, contatori animati, filmstrip galleria (drag), bottoni magnetici
assets/img/             → foto reali del locale (potenziate con AI upscaling 2x, EDSR/FSRCNN), logo trasparente, favicon
assets/img_backup_preupscale/ → backup foto originali pre-upscaling (non cancellare)
```

## Come si modifica un testo
Cercare la chiave `data-i18n="..."` nell'HTML, poi aggiornare la stessa chiave in **entrambe** le lingue dentro `i18n.js` (blocco `it:` e blocco `en:`). Non modificare il testo direttamente nell'HTML per contenuti già tradotti: viene sovrascritto al caricamento.

## Regole di stile già decise (non cambiare senza motivo)
- Nessuna emoji come icona: solo SVG inline
- Cursore di sistema normale (rimosso apposta un cursore custom, l'utente non lo voleva)
- Nessun dark-mode automatico: il sito resta sempre chiaro (rimosso apposta il supporto `prefers-color-scheme`)
- Palette "rustico-elegante": terracotta/vino come accento primario, mai emoji/icone generiche

## Trappola CSS da ricordare
Ogni volta che un `<img>` ha `aspect-ratio` in CSS **e** attributi `width`/`height` nell'HTML, serve **sempre** anche `height: auto` esplicito nella stessa regola — altrimenti l'attributo HTML vince e l'immagine si stira. Bug reale già preso e corretto una volta (vedi commit precedenti), controllare se si aggiungono nuove immagini con aspect-ratio.

## Da sapere se si testa in locale
Il browser mette in cache `style.css` in modo aggressivo col server python base — se una modifica CSS non sembra avere effetto, fare hard refresh (Cmd+Shift+R) prima di pensare che il codice sia sbagliato.

## Cache-busting dopo ogni deploy in produzione
`index.html` e `menu.html` caricano CSS/JS locali con `?v=AAAAMMGG` (es. `style.css?v=20260726`). Dopo **ogni** modifica a un file in `assets/css/` o `assets/js/`, aggiornare questa data in **entrambi** i file HTML (tutti i tag `<link>`/`<script>` locali, non i CDN esterni come GSAP) — altrimenti chi ha già visitato il sito può continuare a vedere CSS/JS vecchi dalla cache del browser anche dopo il nuovo deploy, con bug fantasma che sembrano casuali (stili disallineati, elementi mancanti) ma sono solo un mismatch cache vecchia/HTML nuovo.

## Cosa manca / prossimi passi possibili
- Collegare il form newsletter a un servizio vero (Mailchimp o Brevo) — al momento è solo finto lato client, istruzioni già commentate nell'HTML del form
- Dominio e hosting definitivo (consigliato: Netlify o Vercel, drag&drop della cartella)
- Foto professionali vere, quando disponibili (quelle attuali sono state recuperate dal vecchio sito Weebly e potenziate con AI, ma restano un limite)
