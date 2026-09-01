
import { jsx, jsxs, Fragment } from "react/jsx-runtime";

export { Fragment };

export function jsxDEV(type: any, props: any, key?: any, isStaticChildren?: boolean) {
  return isStaticChildren ? jsxs(type, props, key) : jsx(type, props, key);
}
