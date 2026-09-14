## CSS assets

`admin.css` is the source stylesheet and should be used for development
and modifications.

`admin.min.css` is the production stylesheet used by Neowolf. It is
generated from `admin.css` using CSSO.

CSSO performs structural optimization in addition to minification.
As a result, `admin.min.css` may differ structurally from `admin.css`;
selectors and declarations may be merged or reorganized while preserving
the resulting styles.

Do not edit `admin.min.css` directly. Make changes to `admin.css` and
regenerate the production stylesheet.