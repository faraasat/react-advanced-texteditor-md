import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactNode } from "react";
import type {
  ChipDefinition,
  EditorInstance,
  EditorMode,
  EditorOptions,
  EmbedProvider,
  Highlighter,
  InlineNode,
  LinkPolicy,
  LinkPreviewOptions,
  MathRenderer,
  ParseOptions,
  RenderOptions,
} from "advanced-texteditor-md";

export type ChipNode = Extract<InlineNode, { type: "chip" }>;

/** Every `EditorOptions` field that the React component manages itself. */
type Managed =
  | "value"
  | "mode"
  | "onChange"
  | "onModeChange"
  | "onFocus"
  | "onBlur"
  | "onReady"
  | "onMentionsChange"
  | "onUpload";

/** The core options a `<MarkdownEditor />` forwards unchanged. */
export type EditorConfig = Omit<EditorOptions, Managed>;

/** The callbacks. They may change identity on every render: the latest one is always called. */
export type EditorCallbacks = {
  /** Fires on user edits only (never for `value` prop updates or `setValue`). The second argument is the stable handle. */
  onChange?: (markdown: string, editor: EditorInstance) => void;
  onModeChange?: (mode: EditorMode) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  /** Fires once per created editor (again if a structural option change recreates it). */
  onReady?: (editor: EditorInstance) => void;
  onMentionsChange?: EditorOptions["onMentionsChange"];
  onUpload?: EditorOptions["onUpload"];
  /** The bottom-bar layout's Mod-Enter. Receives the current Markdown. */
  onSubmit?: (markdown: string, editor: EditorInstance) => void;
};

/** What `useMarkdownEditor` and `<MarkdownEditor />` accept: every core option plus the React extras. */
export type UseMarkdownEditorOptions = EditorConfig &
  EditorCallbacks & {
    /** Controlled value. With it the editor follows the prop; see the README ("Controlled and uncontrolled"). */
    value?: string;
    /** Uncontrolled initial value. Ignored after mount. */
    defaultValue?: string;
    /** Controlled mode. */
    mode?: EditorMode;
    /** Uncontrolled initial mode. */
    defaultMode?: EditorMode;
    /**
     * Render a static copy of the initial Markdown until the editor is created (the server render,
     * and the first client render, so hydration matches). Default true. Set false in a client-only
     * app to skip the extra render of a large document.
     */
    ssr?: boolean;
  };

export type MarkdownEditorProps = UseMarkdownEditorOptions & {
  className?: string;
  style?: CSSProperties;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  /** Rendered into the `actions` slot of the `bottom-bar` layout (a portal). Other layouts have no slot: see README. */
  children?: ReactNode;
};

/* ───────────────────────────── MarkdownView ───────────────────────────── */

export type ViewNodeProps<N> = {
  node: N;
  /** The class the library would have used (prefix, node class and `classNames`). */
  className: string;
  /** The default rendering of the node's content. Omit it to replace the content too. */
  children?: ReactNode;
};

type Block<T extends string> = Extract<import("advanced-texteditor-md").BlockNode, { type: T }>;
type Inline<T extends string> = Extract<InlineNode, { type: T }>;
type C<P> = (props: P) => ReactNode;

/** Override how a node renders. Every override receives the node, its class and the default children. */
export type ViewComponents = {
  paragraph?: C<ViewNodeProps<Block<"paragraph">>>;
  heading?: C<ViewNodeProps<Block<"heading">>>;
  blockquote?: C<ViewNodeProps<Block<"blockquote">>>;
  list?: C<ViewNodeProps<Block<"list">>>;
  listItem?: C<ViewNodeProps<import("advanced-texteditor-md").ListItem> & { ordered: boolean }>;
  codeBlock?: C<ViewNodeProps<Block<"codeBlock">> & { html?: string }>;
  mathBlock?: C<ViewNodeProps<Block<"math">>>;
  table?: C<ViewNodeProps<Block<"table">>>;
  thematicBreak?: C<ViewNodeProps<Block<"thematicBreak">>>;
  emphasis?: C<ViewNodeProps<Inline<"emphasis">>>;
  strong?: C<ViewNodeProps<Inline<"strong">>>;
  strike?: C<ViewNodeProps<Inline<"strike">>>;
  code?: C<ViewNodeProps<Inline<"code">>>;
  link?: C<ViewNodeProps<Inline<"link">> & { href: string; external: boolean; rel?: string; target?: string; title?: string; onClick?: (ev: ReactMouseEvent<HTMLAnchorElement>) => void }>;
  image?: C<ViewNodeProps<Inline<"image">> & { src: string }>;
  mathInline?: C<ViewNodeProps<Inline<"math">>>;
  /** Any chip that has no entry in `chips`. */
  chip?: C<ViewNodeProps<ChipNode> & ChipViewProps>;
  /** Chips by `scheme` or `scheme:kind` (the more specific key wins). */
  chips?: Record<string, C<ViewNodeProps<ChipNode> & ChipViewProps>>;
  /** User-defined syntax, by its `name`. */
  custom?: Record<string, C<ViewNodeProps<Inline<"custom"> | Block<"custom">> & { tag: string }>>;
};

export type ChipViewProps = {
  /** `trigger + label`, as the default rendering shows it. */
  text: string;
  /** The kind's badge text from `chips[...].kinds[kind].label`, if any. */
  badge?: string;
  style?: CSSProperties;
  onClick?: (ev: ReactMouseEvent<HTMLElement>) => void;
};

export type MarkdownViewOptions = Pick<ParseOptions, "gfm" | "footnotes" | "syntax" | "chipSchemes"> & {
  /** Parse `$…$` and `$$…$$`. `false` leaves the text as it is. Same shape as the editor's `math`. */
  math?: boolean | { renderer?: MathRenderer | null };
  /** Replaces the built-in TeX renderer. A string result is trusted MathML. */
  mathRenderer?: MathRenderer | null;
  links?: LinkPolicy;
  /** Show a single newline inside a paragraph as a line break. Display only; same option as the core's renderer. */
  softBreak?: "br";
  classPrefix?: string;
  /** Classes added per node type, e.g. `{ table: "my-table", paragraph: "mb-4" }`. */
  classNames?: Partial<Record<string, string>>;
  highlight?: Highlighter | null;
  /** An array (as the editor takes it) or a record keyed by scheme. */
  chips?: ChipDefinition[] | Record<string, ChipDefinition>;
  embeds?: EmbedProvider[];
  /** Set to render the markers that a link-preview controller hydrates (the client `MarkdownView` does it for you). */
  linkPreview?: LinkPreviewOptions;
  labels?: RenderOptions["labels"];
  components?: ViewComponents;
  onChipClick?: (chip: ChipNode, ev: ReactMouseEvent<HTMLElement>) => void;
  /** Called before the browser follows the link; `ev.preventDefault()` stops it. */
  onLinkClick?: (href: string, ev: ReactMouseEvent<HTMLAnchorElement>) => void;
};

export type MarkdownViewProps = MarkdownViewOptions & {
  /** The Markdown to render. */
  markdown: string;
  className?: string;
  style?: CSSProperties;
  id?: string;
  /** Forces the light or dark palette. Omit to follow the page (see the core's theming docs). */
  theme?: "light" | "dark";
  "aria-label"?: string;
};
