# OpenAgent Labforge

> [!NOTE]
> **О производном проекте**
>
> OpenAgent Labforge — производная версия `code-yeongyu/oh-my-openagent`
> (ранее `oh-my-opencode`). Этот форк сохраняет границы лицензии и атрибуцию
> upstream-проекта, но меняет продуктовый фокус: OpenCode-native делегирование,
> исследовательские workflow, эргономика MCP и локально-ориентированная работа.
>
> Подробности см. в `LICENSE.md`, `NOTICE`, `THIRD_PARTY_NOTICES.md` и
> `docs/licensing.md`.
>
> **О синхронизации перевода**
>
> Этот русский README синхронизируется по ключевой практической информации,
> но не всегда мгновенно повторяет полный объём английской и китайской версий.
> Если есть расхождения, ориентируйтесь прежде всего на `README.md` и
> `README.zh-cn.md`.

## Что сейчас изменено в этом форке

Этот README показывает **текущее поведение и реальные усиления проекта**, а не
повторяет историю или рекламный стиль upstream.

### 1. Роли агентов разделены заметно чётче

- оркестраторы и specialist-агенты разведены по ответственности
- `task(subagent_type=...)` считается каноническим путём для inspectable
  child session в OpenCode
- ключевые специализации теперь читаются явно:
  - `librarian` -> один внешний пакет / SDK / framework-вопрос
  - `github-scout` -> сравнение репозиториев и shortlist для изучения
  - `tech-scout` -> экосистема, benchmark, релизы, сигналы рынка
  - `article-writer` -> публичный технический текст
  - `scientific-writer` -> научный / экспертный технический текст
- fallback-chain для фоновых child session теперь регистрируется и очищается корректно

### 2. Поиск разделён на точность и широкий охват

- `websearch` -> более точный и качественный поиск
- `open_websearch_mcp` -> более широкий multi-engine recall
- `paper_search_mcp` -> академический поиск
- `context7` -> официальные docs / framework reference
- `grep_app` -> примеры кода с GitHub

Инъекция search/analyze-подсказок стала легче и больше не пытается
переопределять уже явно выбранного specialist-агента.

### 3. MCP runtime стал устойчивее

- `bing_cn_mcp` заменён на `open_websearch_mcp`
- `open_websearch_mcp` получил корректный `environment`, stdio-mode,
  prompt-probe compatibility, pinned version и увеличенный timeout
- `paper_search_mcp` возвращён на тот launcher-путь, который реально работает
  в этом Windows/OpenCode окружении
- разделение между precision search, broad recall и academic retrieval теперь
  соответствует реальному продукту

### 4. Skill discovery ближе к поведению OpenCode

- project-local skills ищутся вверх до git root
- `SKILL.md` проверяется строже
- установщик автоматически создаёт `openagent-labforge` skill directory для
  более стабильного plugin-aware routing

### 5. Поверхность релиза и установки тоже очищается от наследия upstream

- корневые README больше не являются зеркалом рекламного текста upstream
- installer copy, package metadata и schema metadata приведены к текущему fork
- рекомендуемый путь сейчас: **local build + local install**

## Принцип протокольной совместимости

Новый код в этом форке по возможности продолжает исходную protocol surface
upstream-плагина, а не переписывает её без необходимости.

- приоритет у совместимости config / injection
- registration surface для agent / MCP / command / skill наследует upstream-подход
- fork-расширения наращиваются поверх исходного контракта, а не ломают его молча

Это снижает drift и упрощает дальнейший upstream sync.

## Текущая рекомендация по моделям

Текущий ручной приоритет выбора моделей:

- настоятельно рекомендуются:
  - семейство GPT
  - семейство GLM
  - семейство Kimi
- рекомендуются:
  - Google / Gemini
- также сейчас хорошо адаптируется:
  - семейство DeepSeek
- поддерживается, но ещё не полностью перепроверено в последнем локальном цикле:
  - Claude family

Примечание по Gemini:

- Gemini тоже рекомендуется, но в этой fork-конфигурации при очень длинных
  prompt и смешанном китайско-английском контексте модель иногда может уйти в
  язык ответа, который не совпадает с целевым языком пользователя.

## Рекомендация по контекстному окну

Для устойчивой работы предпочтительны модели, которые стабильно дают
**более 400K контекста**.

Практическое правило:

- модели с контекстом выше 400K обычно заметно устойчивее, чем короткие
- эффективный рабочий контекст лучше держать примерно в диапазоне 500K-550K
- не стоит по умолчанию работать у самого рекламируемого лимита
- для длинных автономных сессий, био-информатических workflow и длинных
  инженерных сессий лучше использовать **модели с контекстом более 500K**
- **1M и выше** обычно дают лучший опыт

Почему это важно:

- модель сама может генерировать очень большие summary
- между compaction-циклами иногда остаётся очень мало реальной работы
- один и тот же model family у разных provider может иметь сильно разный
  фактический лимит контекста

Поэтому ориентируйтесь не только на название модели, но и на фактический
контекстный лимит конкретного provider.

## Рекомендуемые companion plugins

OpenAgent Labforge настоятельно рекомендуется использовать вместе с:

- `opencode-pty`
- `@tarquinen/opencode-dcp`

## Примечание по вкладу

- merge в сценариях с несколькими участниками может занимать больше времени
- maintainer не слишком уверенно чувствует себя в сложных multi-party Git merge flow
- в отдельных окнах с contribution может использоваться AI-assisted review / merge preparation перед финальным merge

## Текущая структура агентов

### Базовые оркестраторы

- `sisyphus`
- `hephaestus`
- `prometheus`
- `atlas`
- `sisyphus-junior`

### Specialist-агенты

- `explore`
- `librarian`
- `github-scout`
- `tech-scout`
- `article-writer`
- `scientific-writer`
- при необходимости bio / multimodal specialists

## Текущая реальность установки

Сейчас проект оптимизирован под:

1. локальную сборку
2. локальную упаковку tgz
3. локальную замену пакета в каталоге конфигурации OpenCode

```bash
bun run build
bun pm pack
```

Далее следуйте `docs/guide/installation.md`.

## Карта документации

- `docs/guide/installation.md` - текущая установка и локальная замена
- `docs/guide/overview.md` - актуальная продуктовая форма
- `docs/guide/orchestration.md` - планирование, выполнение, делегирование
- `docs/reference/configuration.md` - конфигурация
- `docs/reference/features.md` - обзор возможностей
- `examples/README.md` - примеры конфигов и bundle-профилей

## Текущие ограничения

- проект пока остаётся local-first и не доведён до полностью гладкого public npm flow
- часть вторичных документов ещё требует очистки от старой терминологии upstream
- браузерные MCP по-прежнему более чувствительны к окружению, чем core search/docs/code MCP

## Происхождение

- Upstream: `https://github.com/code-yeongyu/oh-my-openagent`
- Current fork: `https://github.com/BOHUYESHAN-APB/openagent-labforge`

Если нижележащий документ расходится с реальным runtime-поведением,
ориентируйтесь в первую очередь на этот README и `docs/guide/installation.md`.

## Другие языки

- [English](README.md)
- [简体中文](README.zh-cn.md)
- [日本語](README.ja.md)
- [한국어](README.ko.md)
- [Русский](README.ru.md)
