/**
 * Marketplace proxy modal.
 *
 * Edits `settings.marketplace.proxy`, the URL the service uses for catalog
 * fetches (official directory, GitHub search) and for repository metadata and
 * icon downloads. Guest installation itself is performed by the host, which
 * uses its own network configuration.
 */

import { button, h } from '../dom.ts';

export interface MarketplaceProxyOptions {
  proxy: string;
  onSave(proxy: string): Promise<void>;
  onClose(): void;
}

const PROXY_URL_PATTERN = /^(https?|socks5h?):\/\//i;

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export function openMarketplaceProxyModal(options: MarketplaceProxyOptions): void {
  const error = h('p', { class: 'error-text' });
  const input = h('input', {
    class: 'input',
    attrs: {
      type: 'text',
      spellcheck: 'false',
      autocomplete: 'off',
      placeholder: 'http://127.0.0.1:10809',
      'aria-label': '扩展市场代理地址',
    },
  }) as HTMLInputElement;
  input.value = options.proxy;

  const overlay = h('div', {
    class: 'modal-overlay',
    on: {
      click: (event) => {
        if (event.target === overlay) close();
      },
    },
  });

  const close = (): void => {
    document.removeEventListener('keydown', onKey);
    overlay.remove();
    options.onClose();
  };

  const onKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') close();
  };

  const apply = (value: string): void => {
    error.textContent = '';
    if (value && !PROXY_URL_PATTERN.test(value)) {
      error.textContent = '代理地址需以 http://、https://、socks5:// 或 socks5h:// 开头';
      return;
    }
    save.disabled = true;
    clearProxy.disabled = true;
    void options
      .onSave(value)
      .then(() => close())
      .catch((saveError: unknown) => {
        error.textContent = messageOf(saveError);
        save.disabled = false;
        clearProxy.disabled = false;
      });
  };

  const save = button(
    '保存',
    () => {
      apply(input.value.trim());
    },
    { variant: 'primary' },
  );

  const clearProxy = button(
    '清除代理',
    () => {
      input.value = '';
      apply('');
    },
    { variant: 'danger' },
  );

  overlay.append(
    h('div', { class: 'modal' }, [
      h('header', { class: 'modal-head' }, [
        h('div', {}, [
          h('h2', { text: '扩展市场代理' }),
          h('p', {
            class: 'muted',
            text: '仅作用于目录抓取与仓库元数据下载，不影响扩展安装（由宿主完成）。',
          }),
        ]),
        button('关闭', close, { title: '关闭（Esc）' }),
      ]),
      h('div', { class: 'modal-body' }, [
        h('label', { class: 'field' }, [
          h('span', { text: '代理地址' }),
          input,
        ]),
        h('p', {
          class: 'muted',
          text: '例如 http://127.0.0.1:10809 或 socks5h://127.0.0.1:1080，留空表示直连。',
        }),
        error,
      ]),
      h('footer', { class: 'modal-foot' }, [clearProxy, save]),
    ]),
  );

  document.addEventListener('keydown', onKey);
  document.body.append(overlay);
  input.focus();
  input.select();
}
