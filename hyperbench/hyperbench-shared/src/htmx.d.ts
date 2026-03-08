import "react";

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
}
