import { emitKeypressEvents } from 'node:readline';

export type CliUiLanguage = 'zh-CN' | 'en';
export type CliUiAction = 'install' | 'doctor' | 'status' | 'rollback';
export type CliUiRuntime =
  | 'all'
  | 'opencode'
  | 'openclaude'
  | 'codex'
  | 'claude-code';

export interface CliUiState {
  language: CliUiLanguage;
  action: CliUiAction;
  runtime: CliUiRuntime;
  dryRun: boolean;
  skillsYes: boolean;
  reset: boolean;
  runtimeRoot: string;
  manifestPath: string;
}

export interface InteractiveCliOptions {
  productName: string;
  version: string;
  initialAction?: CliUiAction;
}

interface ThemePalette {
  accent: [number, number, number];
  accentSoft: [number, number, number];
  text: [number, number, number];
  muted: [number, number, number];
  success: [number, number, number];
  warning: [number, number, number];
  danger: [number, number, number];
}

interface ChoiceOption<T extends string> {
  value: T;
  label: Record<CliUiLanguage, string>;
  hint?: Record<CliUiLanguage, string>;
}

type OptionField =
  | {
      type: 'toggle';
      key: 'dryRun' | 'skillsYes' | 'reset';
      label: Record<CliUiLanguage, string>;
      hint?: Record<CliUiLanguage, string>;
    }
  | {
      type: 'input';
      key: 'runtimeRoot' | 'manifestPath';
      label: Record<CliUiLanguage, string>;
      placeholder: string;
      hint?: Record<CliUiLanguage, string>;
    }
  | {
      type: 'submit';
      key: 'continue';
      label: Record<CliUiLanguage, string>;
      hint?: Record<CliUiLanguage, string>;
    };

type PageId = 'language' | 'action' | 'runtime' | 'options' | 'preview';

type BuiltinPaletteId = 'dark' | 'ocean' | 'mono' | 'sunset';

const THEMES: Record<BuiltinPaletteId, ThemePalette> = {
  dark: {
    accent: [90, 153, 255],
    accentSoft: [45, 64, 96],
    text: [244, 247, 251],
    muted: [145, 156, 175],
    success: [86, 201, 152],
    warning: [255, 191, 92],
    danger: [255, 115, 115],
  },
  ocean: {
    accent: [68, 208, 255],
    accentSoft: [28, 78, 96],
    text: [236, 252, 255],
    muted: [134, 189, 199],
    success: [107, 224, 177],
    warning: [255, 205, 110],
    danger: [255, 128, 158],
  },
  mono: {
    accent: [225, 225, 225],
    accentSoft: [90, 90, 90],
    text: [245, 245, 245],
    muted: [166, 166, 166],
    success: [205, 205, 205],
    warning: [185, 185, 185],
    danger: [155, 155, 155],
  },
  sunset: {
    accent: [255, 126, 95],
    accentSoft: [93, 49, 44],
    text: [255, 245, 240],
    muted: [213, 173, 165],
    success: [255, 204, 128],
    warning: [255, 214, 102],
    danger: [255, 122, 122],
  },
};

const LANGUAGE_OPTIONS: readonly ChoiceOption<CliUiLanguage>[] = [
  {
    value: 'zh-CN',
    label: { 'zh-CN': '中文', en: 'Chinese' },
    hint: {
      'zh-CN': '中文引导、说明与结果页面',
      en: 'Chinese onboarding, labels, and results',
    },
  },
  {
    value: 'en',
    label: { 'zh-CN': '英文', en: 'English' },
    hint: {
      'zh-CN': 'English onboarding, labels, and results',
      en: 'English onboarding, labels, and results',
    },
  },
];

const ACTION_OPTIONS: readonly ChoiceOption<CliUiAction>[] = [
  {
    value: 'install',
    label: { 'zh-CN': '安装 / Install', en: 'Install' },
    hint: {
      'zh-CN': '安装或更新运行时兼容层',
      en: 'Install or update runtime compatibility assets',
    },
  },
  {
    value: 'doctor',
    label: { 'zh-CN': '诊断 / Doctor', en: 'Doctor' },
    hint: {
      'zh-CN': '查看运行时检测、能力矩阵与风险',
      en: 'Inspect runtime detection, capability matrix, and risks',
    },
  },
  {
    value: 'status',
    label: { 'zh-CN': '状态 / Status', en: 'Status' },
    hint: {
      'zh-CN': '查看当前兼容层状态与优先顺序',
      en: 'Show current compatibility status and priority order',
    },
  },
  {
    value: 'rollback',
    label: { 'zh-CN': '回滚 / Rollback', en: 'Rollback' },
    hint: {
      'zh-CN': '从 manifest 执行恢复/删除',
      en: 'Restore or remove files from a backup manifest',
    },
  },
];

function detectDefaultLanguage(): CliUiLanguage {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
  return locale.startsWith('zh') ? 'zh-CN' : 'en';
}

function createInitialState(initialAction?: CliUiAction): CliUiState {
  const action = initialAction ?? 'install';
  return {
    language: detectDefaultLanguage(),
    action,
    runtime:
      action === 'doctor' || action === 'status'
        ? 'all'
        : action === 'rollback'
          ? 'openclaude'
          : 'opencode',
    dryRun: action !== 'doctor' && action !== 'status',
    skillsYes: true,
    reset: false,
    runtimeRoot: '',
    manifestPath: '',
  };
}

function getRuntimeOptions(
  action: CliUiAction,
): readonly ChoiceOption<CliUiRuntime>[] {
  const common: ChoiceOption<CliUiRuntime>[] = [
    {
      value: 'opencode',
      label: { 'zh-CN': 'OpenCode', en: 'OpenCode' },
      hint: {
        'zh-CN': '主宿主，现有能力最完整',
        en: 'Primary host with the most complete current support',
      },
    },
    {
      value: 'openclaude',
      label: { 'zh-CN': 'OpenClaude', en: 'OpenClaude' },
      hint: {
        'zh-CN': '开源优先的 Claude-family 目标',
        en: 'Open-source-first Claude-family target',
      },
    },
    {
      value: 'codex',
      label: { 'zh-CN': 'Codex', en: 'Codex' },
      hint: {
        'zh-CN': '核心目标，但宿主主体较 Rust-heavy',
        en: 'Core target, but the host itself is Rust-heavy',
      },
    },
    {
      value: 'claude-code',
      label: { 'zh-CN': 'Claude (预览)', en: 'Claude (Preview)' },
      hint: {
        'zh-CN': '闭源 Claude 路径，当前保持 preview-only',
        en: 'Closed-source Claude path, currently preview-only',
      },
    },
  ];

  if (action === 'doctor' || action === 'status') {
    return [
      {
        value: 'all',
        label: { 'zh-CN': '全部 Phase-1 运行时', en: 'All phase-1 runtimes' },
        hint: {
          'zh-CN': '一次查看 OpenCode / OpenClaude / Codex',
          en: 'Inspect OpenCode, OpenClaude, and Codex together',
        },
      },
      ...common,
    ];
  }

  return common;
}

function getOptionFields(state: CliUiState): OptionField[] {
  const fields: OptionField[] = [];

  if (state.action === 'install') {
    fields.push({
      type: 'toggle',
      key: 'dryRun',
      label: { 'zh-CN': 'Dry run / 仅预演', en: 'Dry run' },
      hint: {
        'zh-CN': '不写文件，只看预览',
        en: 'Show preview only, do not write files',
      },
    });

    if (state.runtime === 'opencode') {
      fields.push({
        type: 'toggle',
        key: 'skillsYes',
        label: { 'zh-CN': '安装推荐技能', en: 'Install recommended skills' },
        hint: {
          'zh-CN': '仅对 OpenCode 安装流程生效',
          en: 'Only used by the native OpenCode installer flow',
        },
      });
      fields.push({
        type: 'toggle',
        key: 'reset',
        label: { 'zh-CN': '重置已有配置', en: 'Reset existing config' },
        hint: {
          'zh-CN': '覆盖已生成的 Lab 配置',
          en: 'Overwrite generated Lab config when needed',
        },
      });
    } else {
      fields.push({
        type: 'input',
        key: 'runtimeRoot',
        label: {
          'zh-CN': 'Runtime root（可选）',
          en: 'Runtime root (optional)',
        },
        placeholder: 'e.g. C:\\temp\\openclaude-home',
        hint: {
          'zh-CN': '建议测试时填写隔离目录',
          en: 'Recommended for isolated testing targets',
        },
      });
    }
  }

  if (state.action === 'doctor' || state.action === 'status') {
    fields.push({
      type: 'input',
      key: 'runtimeRoot',
      label: { 'zh-CN': 'Runtime root（可选）', en: 'Runtime root (optional)' },
      placeholder: 'e.g. /tmp/openclaude-home',
      hint: {
        'zh-CN': '用于隔离检测目标',
        en: 'Use an isolated runtime root for safer diagnostics',
      },
    });
  }

  if (state.action === 'rollback') {
    fields.push({
      type: 'toggle',
      key: 'dryRun',
      label: { 'zh-CN': 'Dry run / 仅预演', en: 'Dry run' },
      hint: {
        'zh-CN': '不恢复文件，只看回滚预览',
        en: 'Preview rollback without restoring/removing files',
      },
    });
    fields.push({
      type: 'input',
      key: 'manifestPath',
      label: { 'zh-CN': 'Manifest 路径', en: 'Manifest path' },
      placeholder: '.opencode/extendai-lab/backups/latest/manifest.json',
      hint: {
        'zh-CN': '执行真实回滚时需要 manifest',
        en: 'Required for real rollback apply',
      },
    });
  }

  fields.push({
    type: 'submit',
    key: 'continue',
    label: { 'zh-CN': '继续 / Preview', en: 'Continue / Preview' },
    hint: {
      'zh-CN': '进入最终预览页并确认执行',
      en: 'Go to the final preview and confirm execution',
    },
  });

  return fields;
}

export function buildCommandArgsFromUiState(state: CliUiState): string[] {
  const args: string[] = [state.action];

  if (state.action === 'install') {
    if (state.runtime !== 'opencode') {
      args.push(`--runtime=${state.runtime}`);
    }
    if (state.dryRun) args.push('--dry-run');
    if (state.runtimeRoot && state.runtime !== 'opencode') {
      args.push(`--runtime-root=${state.runtimeRoot}`);
    }
    if (state.runtime === 'opencode' && !state.skillsYes) {
      args.push('--skills=no');
    }
    if (state.runtime === 'opencode' && state.reset) {
      args.push('--reset');
    }
    return args;
  }

  if (state.action === 'doctor' || state.action === 'status') {
    if (state.runtime !== 'all') args.push(`--runtime=${state.runtime}`);
    if (state.runtimeRoot && state.runtime !== 'all') {
      args.push(`--runtime-root=${state.runtimeRoot}`);
    }
    return args;
  }

  if (state.action === 'rollback') {
    args.push(`--runtime=${state.runtime}`);
    if (state.manifestPath) args.push(`--manifest=${state.manifestPath}`);
    if (state.dryRun) args.push('--dry-run');
    return args;
  }

  return args;
}

function rgb([r, g, b]: [number, number, number], text: string): string {
  return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
}

function bold(text: string): string {
  return `\x1b[1m${text}\x1b[0m`;
}

function clearScreen(): void {
  process.stdout.write('\x1b[2J\x1b[H');
}

function getTheme(page: PageId): ThemePalette {
  const paletteByPage: Record<PageId, BuiltinPaletteId> = {
    language: 'dark',
    action: 'ocean',
    runtime: 'sunset',
    options: 'dark',
    preview: 'mono',
  };

  return THEMES[paletteByPage[page]];
}

function t(state: CliUiState, zh: string, en: string): string {
  return state.language === 'zh-CN' ? zh : en;
}

function renderHeader(
  options: InteractiveCliOptions,
  state: CliUiState,
  page: PageId,
): string[] {
  const theme = getTheme(page);
  const title = `${options.productName} CLI`;
  const subtitle = t(
    state,
    '现代化终端引导界面 · 三大开源 CLI 优先',
    'Modern terminal onboarding · open-source-first runtimes',
  );
  const steps: PageId[] = [
    'language',
    'action',
    'runtime',
    'options',
    'preview',
  ];
  const currentStep = steps.indexOf(page) + 1;
  return [
    rgb(theme.accent, bold(title)),
    rgb(theme.muted, `${subtitle}  ·  v${options.version}`),
    rgb(theme.accentSoft, '─'.repeat(72)),
    rgb(
      theme.muted,
      `${t(state, '步骤', 'Step')} ${currentStep}/${steps.length} · ${t(
        state,
        '↑/↓ 选择  Enter 确认  Space 切换开关  Esc 返回/取消',
        '↑/↓ select  Enter confirm  Space toggles switches  Esc back/cancel',
      )}`,
    ),
    '',
  ];
}

function renderChoicePage<T extends string>(
  options: InteractiveCliOptions,
  state: CliUiState,
  page: PageId,
  title: string,
  description: string,
  items: readonly ChoiceOption<T>[],
  _selected: T,
  focused: number,
): string {
  const theme = getTheme(page);
  const lines = [
    ...renderHeader(options, state, page),
    bold(title),
    description,
    '',
  ];

  items.forEach((item, index) => {
    const isFocused = index === focused;
    const prefix = isFocused ? rgb(theme.accent, '›') : ' ';
    const label = isFocused
      ? rgb(theme.text, bold(item.label[state.language]))
      : rgb(theme.text, item.label[state.language]);
    lines.push(`${prefix} ${label}`);
    if (item.hint) {
      lines.push(`    ${rgb(theme.muted, item.hint[state.language])}`);
    }
    lines.push('');
  });

  lines.push(
    rgb(
      theme.warning,
      t(
        state,
        '提示：单选页面用方向键切换当前选中项，Enter 确认进入下一页。',
        'Tip: On single-choice pages, use arrow keys to move the active selection and Enter to confirm.',
      ),
    ),
  );
  return lines.join('\n');
}

function renderOptionsPage(
  options: InteractiveCliOptions,
  state: CliUiState,
  focused: number,
  editingField: OptionField | undefined,
  editBuffer: string,
): string {
  const theme = getTheme('options');
  const fields = getOptionFields(state);
  const lines = [
    ...renderHeader(options, state, 'options'),
    bold(t(state, '配置选项', 'Options')),
    rgb(
      theme.muted,
      t(
        state,
        '在这里调整 dry-run、路径和安装行为。',
        'Adjust dry-run, paths, and install behavior here.',
      ),
    ),
    '',
  ];

  fields.forEach((field, index) => {
    const isFocused = index === focused;
    const prefix = isFocused ? rgb(theme.accent, '›') : ' ';
    if (field.type === 'toggle') {
      const enabled = state[field.key];
      const marker = enabled
        ? rgb(theme.success, '[x]')
        : rgb(theme.muted, '[ ]');
      const label = isFocused
        ? rgb(theme.text, bold(field.label[state.language]))
        : rgb(theme.text, field.label[state.language]);
      lines.push(`${prefix} ${marker} ${label}`);
      if (field.hint) {
        lines.push(`    ${rgb(theme.muted, field.hint[state.language])}`);
      }
    } else if (field.type === 'input') {
      const value =
        editingField?.key === field.key ? editBuffer : state[field.key];
      const shown = value || rgb(theme.muted, field.placeholder);
      const label = isFocused
        ? rgb(theme.text, bold(field.label[state.language]))
        : rgb(theme.text, field.label[state.language]);
      lines.push(`${prefix} ${rgb(theme.warning, '[input]')} ${label}`);
      lines.push(`    ${shown}`);
      if (field.hint) {
        lines.push(`    ${rgb(theme.muted, field.hint[state.language])}`);
      }
      if (editingField?.key === field.key) {
        lines.push(
          `    ${rgb(
            theme.accent,
            t(
              state,
              '正在输入… Enter 保存，Esc 取消。',
              'Editing… Enter saves, Esc cancels.',
            ),
          )}`,
        );
      }
    } else {
      lines.push(
        `${prefix} ${rgb(theme.accent, '[→]')} ${bold(field.label[state.language])}`,
      );
      if (field.hint) {
        lines.push(`    ${rgb(theme.muted, field.hint[state.language])}`);
      }
    }
    lines.push('');
  });

  return lines.join('\n');
}

function renderPreviewPage(
  options: InteractiveCliOptions,
  state: CliUiState,
): string {
  const theme = getTheme('preview');
  const args = buildCommandArgsFromUiState(state);
  const lines = [
    ...renderHeader(options, state, 'preview'),
    bold(t(state, '执行预览', 'Execution Preview')),
    rgb(
      theme.muted,
      t(
        state,
        '确认后将退出引导界面并执行实际 CLI 流程。',
        'Confirming will leave the guided UI and run the actual CLI flow.',
      ),
    ),
    '',
    `${rgb(theme.accent, 'Action:')} ${state.action}`,
    `${rgb(theme.accent, 'Runtime:')} ${state.runtime}`,
    `${rgb(theme.accent, 'Language:')} ${state.language}`,
    '',
    bold(t(state, '将执行的命令参数', 'Command arguments to run')),
    `  ${args.join(' ')}`,
    '',
  ];

  if (state.action === 'install' && state.runtime === 'claude-code') {
    lines.push(
      rgb(
        theme.warning,
        t(
          state,
          '注意：Claude 仍是 preview-only 路径。',
          'Note: Claude remains preview-only.',
        ),
      ),
    );
    lines.push('');
  }

  lines.push(
    rgb(
      theme.warning,
      t(
        state,
        'Enter 确认执行，Esc 返回修改。',
        'Press Enter to execute, Esc to go back.',
      ),
    ),
  );

  return lines.join('\n');
}

function updateRuntimeForAction(state: CliUiState): void {
  if (state.action === 'doctor' || state.action === 'status') {
    if (state.runtime !== 'all') return;
    return;
  }

  if (state.runtime === 'all') {
    state.runtime = state.action === 'rollback' ? 'openclaude' : 'opencode';
  }
}

export async function runInteractiveCli(
  options: InteractiveCliOptions,
): Promise<string[] | null> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) return null;

  const state = createInitialState(options.initialAction);
  const pages: PageId[] = [
    'language',
    'action',
    'runtime',
    'options',
    'preview',
  ];
  let pageIndex = 0;
  let focused = 0;
  let editingField: OptionField | undefined;
  let editBuffer = '';

  const render = () => {
    clearScreen();

    const page = pages[pageIndex];
    let output = '';
    if (page === 'language') {
      output = renderChoicePage(
        options,
        state,
        page,
        t(state, '选择语言', 'Choose language'),
        t(
          state,
          '先确定引导页面语言。后续所有标签和说明都会跟随切换。',
          'Set the interface language first. Labels and guidance follow this choice.',
        ),
        LANGUAGE_OPTIONS,
        state.language,
        focused,
      );
    } else if (page === 'action') {
      output = renderChoicePage(
        options,
        state,
        page,
        t(state, '选择功能', 'Choose action'),
        t(
          state,
          'Install / Doctor / Status / Rollback 都从这个统一入口进入。',
          'Install / Doctor / Status / Rollback all start from this guided shell.',
        ),
        ACTION_OPTIONS,
        state.action,
        focused,
      );
    } else if (page === 'runtime') {
      output = renderChoicePage(
        options,
        state,
        page,
        t(state, '选择运行时', 'Choose runtime'),
        t(
          state,
          '优先顺序是 OpenCode -> OpenClaude -> Codex，Claude 仍保持 preview-only。',
          'Priority is OpenCode -> OpenClaude -> Codex; Claude remains preview-only.',
        ),
        getRuntimeOptions(state.action),
        state.runtime,
        focused,
      );
    } else if (page === 'options') {
      output = renderOptionsPage(
        options,
        state,
        focused,
        editingField,
        editBuffer,
      );
    } else {
      output = renderPreviewPage(options, state);
    }

    process.stdout.write(`${output}\n`);
  };

  const cleanup = () => {
    process.stdin.off('keypress', onKeypress);
    if (process.stdin.isTTY) process.stdin.setRawMode(false);
    clearScreen();
  };

  const goToNext = () => {
    if (pageIndex < pages.length - 1) {
      pageIndex += 1;
      focused = 0;
      editingField = undefined;
      editBuffer = '';
    }
  };

  const goToPrevious = () => {
    if (pageIndex === 0) return;
    pageIndex -= 1;
    focused = 0;
    editingField = undefined;
    editBuffer = '';
  };

  const setChoice = (index: number) => {
    const page = pages[pageIndex];
    if (page === 'language') {
      state.language = LANGUAGE_OPTIONS[index]?.value ?? state.language;
    }
    if (page === 'action') {
      state.action = ACTION_OPTIONS[index]?.value ?? state.action;
      updateRuntimeForAction(state);
    }
    if (page === 'runtime') {
      const runtimeOptions = getRuntimeOptions(state.action);
      state.runtime = runtimeOptions[index]?.value ?? state.runtime;
    }
  };

  const onKeypress = async (
    _str: string,
    key: {
      name?: string;
      sequence?: string;
      ctrl?: boolean;
      meta?: boolean;
      shift?: boolean;
    },
  ) => {
    if (editingField) {
      if (key.name === 'return') {
        if (editingField.type === 'input') {
          state[editingField.key] = editBuffer;
        }
        editingField = undefined;
        editBuffer = '';
        render();
        return;
      }
      if (key.name === 'escape') {
        editingField = undefined;
        editBuffer = '';
        render();
        return;
      }
      if (key.name === 'backspace') {
        editBuffer = editBuffer.slice(0, -1);
        render();
        return;
      }
      if (key.sequence && !key.ctrl && !key.meta && key.sequence >= ' ') {
        editBuffer += key.sequence;
        render();
      }
      return;
    }

    const page = pages[pageIndex];
    const optionCount =
      page === 'language'
        ? LANGUAGE_OPTIONS.length
        : page === 'action'
          ? ACTION_OPTIONS.length
          : page === 'runtime'
            ? getRuntimeOptions(state.action).length
            : page === 'options'
              ? getOptionFields(state).length
              : 1;

    if (key.name === 'up' || (key.name === 'tab' && key.shift)) {
      focused = (focused - 1 + optionCount) % optionCount;
      render();
      return;
    }
    if (key.name === 'down' || key.name === 'tab') {
      focused = (focused + 1) % optionCount;
      render();
      return;
    }
    if (key.name === 'escape') {
      if (pageIndex === 0) {
        cleanup();
        resolvePromise(null);
        return;
      }
      goToPrevious();
      render();
      return;
    }
    if (key.name === 'q' && !key.ctrl && !key.meta) {
      cleanup();
      resolvePromise(null);
      return;
    }
    if (key.name === 'space') {
      if (page === 'options') {
        const field = getOptionFields(state)[focused];
        if (field?.type === 'toggle') {
          state[field.key] = !state[field.key];
        }
      }
      render();
      return;
    }
    if (key.name === 'return') {
      if (page === 'language' || page === 'action' || page === 'runtime') {
        setChoice(focused);
        goToNext();
        render();
        return;
      }
      if (page === 'options') {
        const field = getOptionFields(state)[focused];
        if (!field) return;
        if (field.type === 'toggle') {
          state[field.key] = !state[field.key];
          render();
          return;
        }
        if (field.type === 'input') {
          editingField = field;
          editBuffer = state[field.key];
          render();
          return;
        }
        goToNext();
        render();
        return;
      }
      cleanup();
      resolvePromise(buildCommandArgsFromUiState(state));
    }
  };

  let resolvePromise!: (value: string[] | null) => void;
  const promise = new Promise<string[] | null>((resolve) => {
    resolvePromise = resolve;
  });

  emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.on('keypress', onKeypress);
  render();

  return promise;
}
