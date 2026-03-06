# Сказка Вместе

Интерактивные сказки для совместного чтения с ребёнком через видеозвонок.

## Структура

```
index.html      ← Лендинг (чистый HTML + GSAP + Lenis)
app.html        ← Точка входа React-приложения
src/
  main.jsx      ← React bootstrap
  App.jsx       ← Платформа (Auth → Dashboard → Session → Report)
vite.config.js  ← Multi-page конфиг
```

## Установка

```bash
npm install
npm run dev
```

## Навигация

- `http://localhost:5173/` → Лендинг
- `http://localhost:5173/app.html` → Платформа (Auth/Dashboard)

Кнопки «Попробовать» и «Начать бесплатно» на лендинге ведут на `/app.html`.
Кнопка «Выйти» в платформе возвращает на `/` (лендинг).

## Стек

- **Лендинг**: Vanilla HTML/CSS/JS, GSAP 3.12 + ScrollTrigger, Lenis smooth scroll
- **Платформа**: React 18, Anthropic API (Claude Sonnet), persistent storage
- **Шрифты**: Cormorant Garamond + Outfit
- **Палитра**: «Вечернее чтение» — пергамент, абрикос, шалфей

## Build

```bash
npm run build    # → dist/ (обе страницы)
npm run preview  # Превью билда
```
