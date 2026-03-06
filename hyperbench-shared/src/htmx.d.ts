import "react";

type ShoelaceBase = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;

declare module "react" {
  interface HTMLAttributes<T> {
    "hx-get"?: string;
    "hx-post"?: string;
    "hx-put"?: string;
    "hx-delete"?: string;
    "hx-patch"?: string;
    "hx-target"?: string;
    "hx-swap"?: string;
    "hx-trigger"?: string;
    "hx-confirm"?: string;
    "hx-push-url"?: string | boolean;
    "hx-ext"?: string;
    "hx-include"?: string;
  }

  // Shoelace web component intrinsic elements
  namespace JSX {
    interface IntrinsicElements {
      "sl-input": ShoelaceBase & {
        label?: string;
        type?: string;
        name?: string;
        value?: string | number;
        placeholder?: string;
        required?: boolean;
        disabled?: boolean;
        minlength?: number;
        maxlength?: number;
        min?: number | string;
        max?: number | string;
        size?: string;
        pill?: boolean;
        clearable?: boolean;
      };
      "sl-select": ShoelaceBase & {
        label?: string;
        name?: string;
        value?: string;
        required?: boolean;
        disabled?: boolean;
        placeholder?: string;
        size?: string;
        clearable?: boolean;
        multiple?: boolean;
      };
      "sl-option": ShoelaceBase & {
        value?: string;
        disabled?: boolean;
      };
      "sl-textarea": ShoelaceBase & {
        label?: string;
        name?: string;
        value?: string;
        placeholder?: string;
        required?: boolean;
        disabled?: boolean;
        maxlength?: number;
        rows?: number;
        resize?: string;
        size?: string;
      };
      "sl-button": ShoelaceBase & {
        type?: string;
        variant?: string;
        size?: string;
        disabled?: boolean;
        loading?: boolean;
        outline?: boolean;
        pill?: boolean;
        href?: string;
      };
      "sl-card": ShoelaceBase;
      "sl-badge": ShoelaceBase & {
        variant?: string;
        pill?: boolean;
        pulse?: boolean;
      };
      "sl-avatar": ShoelaceBase & {
        initials?: string;
        image?: string;
        label?: string;
        shape?: string;
      };
      "sl-icon": ShoelaceBase & {
        name?: string;
        src?: string;
        label?: string;
        library?: string;
      };
      "sl-icon-button": ShoelaceBase & {
        name?: string;
        label?: string;
        href?: string;
        target?: string;
        disabled?: boolean;
      };
      "sl-checkbox": ShoelaceBase & {
        checked?: boolean;
        disabled?: boolean;
        name?: string;
        value?: string;
      };
      "sl-divider": ShoelaceBase & {
        vertical?: boolean;
      };
      "sl-alert": ShoelaceBase & {
        variant?: string;
        open?: boolean;
        closable?: boolean;
        duration?: number;
      };
      "sl-progress-bar": ShoelaceBase & {
        value?: number | string;
        indeterminate?: boolean;
        label?: string;
      };
    }
  }
}
