//
// The Scripter environment.
//
// What's declared in there is available to scripts in their global namespace.
//

// symbolic type aliases
type int   = number
type float = number
type byte  = number
type bool  = boolean

/** Outputs a message to the console and on screen */
declare function print(...args :any[]) :void

/** Throws an error if condition is not thruthy */
declare function assert(condition :any, ...message :any[]) :void

/** Close scripter, optionally showing a message (e.g. reason, status, etc) */
declare function closeScripter(message? :string) :void

// timer functions
declare function clearInterval(id?: number): void;
declare function clearTimeout(id?: number): void;
declare function setInterval(handler: string|Function, timeout?: number, ...arguments: any[]): number;
declare function setTimeout(handler: string|Function, timeout?: number, ...arguments: any[]): number;

/** Start a timer that expires after `duration` milliseconds */
declare function timer(duration :number, handler? :(canceled?:boolean)=>any) :Timer
interface Timer<T = void> extends Promise<T> {
  cancel() :void

  then<R1=T,R2=never>(
    onfulfilled?: ((value: T) => R1|PromiseLike<R1>)|undefined|null,
    onrejected?: ((reason: any) => R2|PromiseLike<R2>)|undefined|null,
  ): Timer<R1>;

  catch(onrejected?: ((reason: any) => any|PromiseLike<any>)|undefined|null): Timer<T>;
}

declare class TimerCancellation extends Error {
  readonly name :"TimerCancellation"
}

/**
 * Calls f at a high frequency.
 * `time` is a monotonically-incrementing number of seconds with millisecond precision.
 * Return or throw "STOP" to end animation which resolved the promise.
 */
declare function animate(f :(time :number) => void|"STOP") :Animation;
interface Animation extends Promise<void> {
  cancel() :void
}

/** Set to true if the script was canceled by the user */
declare var canceled :boolean;

/** Scripter-specific API */
declare var scripter :ScripterAPI;
interface ScripterAPI {
  /** Visualize print() results inline in editor. Defaults to true */
  visualizePrint :bool
}

/**
 * Shows a modal dialog with question and yes/no buttons.
 * Returns true if the user answered "yes".
 */
declare function confirm(question: string): Promise<bool>;


// ------------------------------------------------------------------------------------
// fetch

/**
 * Starts the process of fetching a resource from the network, returning a promise
 * which is fulfilled once the response is available.
 */
declare function fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;

/** Shorthand for fetch().then(r => r.text()) */
declare function fetchText(input: RequestInfo, init?: RequestInit): Promise<string>;

/** Shorthand for fetch().then(r => r.json()) */
declare function fetchJson(input: RequestInfo, init?: RequestInit): Promise<any>;

/** Shorthand for fetch().then(r => r.arrayBuffer()).then(b => new Uint8Array(b)) */
declare function fetchData(input: RequestInfo, init?: RequestInit): Promise<Uint8Array>;

/** Shorthand for fetchData().then(data => Img(data)) */
declare function fetchImg(input: RequestInfo, init?: RequestInit): Promise<Img>;


// ------------------------------------------------------------------------------------
// Img

/** Drawable image. Accepts a URL or image data. Can be passed to print for display. */
declare interface Img<DataType=null|Uint8Array> {
  type        :string      // mime type
  width       :number      // 0 means "unknown"
  height      :number      // 0 means "unknown"
  pixelWidth  :number      // 0 means "unknown"
  pixelHeight :number      // 0 means "unknown"
  source      :string|Uint8Array // url or image data
  data        :DataType    // image data if loaded

  /** Type-specific metadata. Populated when image data is available. */
  meta :{[k:string]:any}

  /** Load the image. Resolves immediately if source is Uint8Array. */
  load() :Promise<Img<Uint8Array>>
}
interface ImgOptions {
  type?   :string  // mime type
  width?  :number
  height? :number
}
interface ImgConstructor {
  new(data :ArrayBufferLike|Uint8Array|ArrayLike<number>, optionsOrWidth? :ImgOptions|number): Img<Uint8Array>;
  new(url :string, optionsOrWidth? :ImgOptions|number): Img<null>;
  (data :ArrayBufferLike|Uint8Array|ArrayLike<number>, optionsOrWidth? :ImgOptions|number): Img<Uint8Array>;
  (url :string, optionsOrWidth? :ImgOptions|number): Img<null>;
}
declare var Img: ImgConstructor;


// ------------------------------------------------------------------------------------
// path, file, data

declare namespace Path {
  /** Returns the filename extension without ".". Returns "" if none. */
  function ext(name :string) :string

  /** Returns the directory part of the path. E.g. "/foo/bar/baz" => "/foo/bar" */
  function dir(path :string) :string

  /** Returns the base of the path. E.g. "/a/b" => "b" */
  function base(path :string) :string

  /** Cleans up the pathname. E.g. "a/c//b/.." => "a/c" */
  function clean(path :string) :string

  /** True if the path is absolute */
  function isAbs(path :string) :bool

  /** Returns a path with paths joined together. E.g. ["foo/", "//bar", "baz"] => "foo/bar/baz" */
  function join(...paths :string[]) :string
  function join(paths :string[]) :string

  /** Returns a list of path components. E.g. "/foo//bar/" => ["", "foo", "bar"] */
  function split(path :string) :string[]
}

/**
 * Inspects the header (first ~20 or so bytes) of data to determine the type of file.
 * Similar to the POSIX "file" program. Returns null if unknown.
 */
declare function fileType(data :ArrayLike<byte>|ArrayBuffer) :FileTypeInfo|null
/** Returns mime type and other information for the file, based on the provided filename. */
declare function fileType(filename :string) :FileTypeInfo|null
/** Data returned by the fileType function, describing a type of file data */
interface FileTypeInfo {
  type :string    // mime type
  exts :string[]  // filename extensions
  description? :string
}


/**
 * Returns a Uint8Array of the input.
 * If the input is a string, it's expected to be a description of bytes, not a literal.
 * Example: "FF a7 0x9, 4" (whitespace, linebreaks and comma are ignored)
 * If the input is some kind of list, it is converted if needed to a Uint8Array.
 */
declare function Bytes(input :string|ArrayLike<byte>|ArrayBuffer|Iterable<byte>) :Uint8Array


// ------------------------------------------------------------------------------------
// Figma

/** A node that may have children */
type ContainerNode = BaseNode & ChildrenMixin

// [All nodes which extends DefaultShapeMixin]
/** Shape is a node with visible geometry. I.e. may have fill, stroke etc. */
type Shape = BooleanOperationNode
           | EllipseNode
           | LineNode
           | PolygonNode
           | RectangleNode
           | StarNode
           | TextNode
           | VectorNode

/** Get the current selection in Figma */
declare function selection(): ReadonlyArray<SceneNode>;
/** Get the nth currently-selected node in Figma */
declare function selection(index :number): SceneNode|null;

/** Set the current selection. Non-selectable nodes of n, like pages, are ignored. */
declare function setSelection(n :BaseNode|null|undefined|ReadonlyArray<BaseNode|null|undefined>) :void;

/** Version of Figma plugin API that is currently in use */
declare var apiVersion: string

/** Current document in Figma. Equivalent to figma.root */
declare var document: DocumentNode

/** Viewport */
declare var viewport: ViewportAPI

/** The "MIXED" symbol (figma.mixed), signifying "mixed properties" */
declare var MIXED: symbol

/**
 * Store data on the user's local machine. Similar to localStorage.
 * Data may disappear if user clears their web browser cache.
 */
declare var clientStorage: ClientStorageAPI

/** Presents a short ambient message to the user, at the bottom of the screen */
declare function notify(message: string, options?: NotificationOptions): NotificationHandler

/** Create a new group from nodes. Parent defaults to current page's canvas. */
declare function group(nodes: ReadonlyArray<BaseNode>, parent?: null|ContainerNode, index?: number): FrameNode;

// Node constructors
// Essentially figma.createNodeType + optional assignment of props
//
/** Creates a new Page */
declare function Page(props? :Partial<PageNode>): PageNode;
/** Creates a new Rectangle */
declare function Rectangle(props? :Partial<RectangleNode>) :RectangleNode;
/** Creates a new Rectangle */
declare function Rect(props? :Partial<RectangleNode>) :RectangleNode;
/** Creates a new Line */
declare function Line(props? :Partial<LineNode>): LineNode;
/** Creates a new Ellipse */
declare function Ellipse(props? :Partial<EllipseNode>): EllipseNode;
/** Creates a new Polygon */
declare function Polygon(props? :Partial<PolygonNode>): PolygonNode;
/** Creates a new Star */
declare function Star(props? :Partial<StarNode>): StarNode;
/** Creates a new Vector */
declare function Vector(props? :Partial<VectorNode>): VectorNode;
/** Creates a new Text */
declare function Text(props? :Partial<TextNode>): TextNode;
/** Creates a new BooleanOperation */
declare function BooleanOperation(props? :Partial<BooleanOperationNode>): BooleanOperationNode;
/** Creates a new Frame */
declare function Frame(props? :Partial<FrameNode>): FrameNode;
/** Creates a new Component */
declare function Component(props? :Partial<ComponentNode>): ComponentNode;
/** Creates a new Slice */
declare function Slice(props? :Partial<SliceNode>): SliceNode;
/** Creates a new PaintStyle */
declare function PaintStyle(props? :Partial<PaintStyle>): PaintStyle;
/** Creates a new TextStyle */
declare function TextStyle(props? :Partial<TextStyle>): TextStyle;
/** Creates a new EffectStyle */
declare function EffectStyle(props? :Partial<EffectStyle>): EffectStyle;
/** Creates a new GridStyle */
declare function GridStyle(props? :Partial<GridStyle>): GridStyle;


// Type guards, nodes
//
/** Checks if node is of type Document */
declare function isDocument(n :BaseNode|null|undefined) :n is DocumentNode;
/** Checks if node is of type Page */
declare function isPage(n :BaseNode|null|undefined) :n is PageNode;
/** Checks if node is of type Rectangle */
declare function isRectangle(n :BaseNode|null|undefined) :n is RectangleNode;
/** Checks if node is of type Rectangle */
declare function isRect(n :BaseNode|null|undefined) :n is RectangleNode;
/** Checks if node is of type Line */
declare function isLine(n :BaseNode|null|undefined): n is LineNode;
/** Checks if node is of type Ellipse */
declare function isEllipse(n :BaseNode|null|undefined): n is EllipseNode;
/** Checks if node is of type Polygon */
declare function isPolygon(n :BaseNode|null|undefined): n is PolygonNode;
/** Checks if node is of type Star */
declare function isStar(n :BaseNode|null|undefined): n is StarNode;
/** Checks if node is of type Vector */
declare function isVector(n :BaseNode|null|undefined): n is VectorNode;
/** Checks if node is of type Text */
declare function isText(n :BaseNode|null|undefined): n is TextNode;
/** Checks if node is of type BooleanOperation */
declare function isBooleanOperation(n :BaseNode|null|undefined): n is BooleanOperationNode;
/** Checks if node is of type Frame */
declare function isFrame(n :BaseNode|null|undefined): n is FrameNode & {type:"FRAME"};
/** Checks if node is of type Group */
declare function isGroup(n :BaseNode|null|undefined): n is FrameNode & {type:"GROUP"};
/** Checks if node is of type Component */
declare function isComponent(n :BaseNode|null|undefined): n is ComponentNode;
/** Checks if node is of type Component */
declare function isInstance(n :BaseNode|null|undefined): n is InstanceNode;
/** Checks if node is of type Slice */
declare function isSlice(n :BaseNode|null|undefined): n is SliceNode;
/** Checks if node is a type of SceneNode */
declare function isSceneNode(n :BaseNode|null|undefined): n is SceneNode;
/** Checks if node is a type with children */
declare function isContainerNode(n :BaseNode|null|undefined): n is ContainerNode;
/** Checks if node is a Shape */
declare function isShape(n :BaseNode|null|undefined): n is Shape;

/**
 * Returns true if n is a shape with at least one visible image.
 * If a layer has an "image" icon in Figma, this returns true.
 */
declare function isImage<N extends Shape>(n :N) :n is N & { fills :ReadonlyArray<Paint> }; // fills not mixed
declare function isImage(n :BaseNode) :n is Shape & { fills :ReadonlyArray<Paint> }; // fills not mixed

// Type guards, paints
//
/** Checks if paint is an image */
declare function isImage(p :Paint|null|undefined) :p is ImagePaint;
/** Checks if paint is a gradient */
declare function isGradient(p :Paint|null|undefined) :p is GradientPaint;
/** Checks if paint is a solid color */
declare function isSolidPaint(p :Paint|null|undefined) :p is SolidPaint;

// Type guards, styles
//
/** Checks if style is a paint style */
declare function isPaintStyle(s :BaseStyle|null|undefined) :p is PaintStyle;
/** Checks if style is a text style */
declare function isTextStyle(s :BaseStyle|null|undefined) :p is TextStyle;
/** Checks if style is a effect style */
declare function isEffectStyle(s :BaseStyle|null|undefined) :p is EffectStyle;
/** Checks if style is a grid style */
declare function isGridStyle(s :BaseStyle|null|undefined) :p is GridStyle;

interface Color extends RGB { // compatible with RGB interface
  readonly r: number
  readonly g: number
  readonly b: number
  withAlpha(a :number) :ColorWithAlpha
  readonly paint :SolidPaint
}
interface ColorWithAlpha extends Color, RGBA { // compatible with RGBA interface
  readonly a: number
  withoutAlpha() :Color
}

/** Create a color with alpha channel. Values should be in range [0-1]. */
declare function Color(r :number, g: number, b :number, a :number) :ColorWithAlpha;

/** Create a color. Values should be in range [0-1]. */
declare function Color(r :number, g: number, b :number) :Color;

/**
 * Create a color from hexadecimal string.
 * hexstr should be in the format "RRGGBB", "RGB" or "HH" for greyscale.
 * Examples: C800A1, C0A, CC
 */
declare function Color(hexstr :string) :Color;

/** Create a color. Values should be in range [0-1]. */
declare function RGB(r :number, g: number, b :number) :Color;

/** Create a color with alpha channel. Values should be in range [0-1]. */
declare function RGBA(r :number, g: number, b :number, a? :number) :ColorWithAlpha;

// common colors
/** #000000 Color(0   , 0   , 0)   */ declare const BLACK   :Color;
/** #FFFFFF Color(1   , 1   , 1)   */ declare const WHITE   :Color;
/** #808080 Color(0.5 , 0.5 , 0.5) */ declare const GREY    :Color;
/** #808080 Color(0.5 , 0.5 , 0.5) */ declare const GRAY    :Color;
/** #FF0000 Color(1   , 0   , 0)   */ declare const RED     :Color;
/** #00FF00 Color(0   , 1   , 0)   */ declare const GREEN   :Color;
/** #0000FF Color(0   , 0   , 1)   */ declare const BLUE    :Color;
/** #00FFFF Color(0   , 1   , 1)   */ declare const CYAN    :Color;
/** #FF00FF Color(1   , 0   , 1)   */ declare const MAGENTA :Color;
/** #FFFF00 Color(1   , 1   , 0)   */ declare const YELLOW  :Color;
/** #FF8000 Color(1   , 0.5 , 0)   */ declare const ORANGE  :Color;


// ------------------------------------------------------------------------------------
// find & visit

/**
 * find traverses the tree represented by node and
 * returns a list of all nodes for which predicate returns true.
 *
 * The predicate is not called for `node` when its a single node,
 * but when `node` is an array, predicate is called for each item in `node`.
 */
declare function find<R extends BaseNode>(
  node :ContainerNode|ReadonlyArray<BaseNode>,
  predicate :(n :BaseNode) => R,
  options? :FindOptions,
) :Promise<R[]>

declare function find<R extends BaseNode>(
  node :ContainerNode|ReadonlyArray<BaseNode>,
  predicate :(n :BaseNode) => boolean|undefined|void,
  options? :FindOptions,
) :Promise<BaseNode[]>

/**
 * find traverses the current page and
 * returns a list of all nodes for which predicate returns true.
 *
 * The predicate is not called for `node` when its a single node,
 * but when `node` is an array, predicate is called for each item in `node`.
 */
declare function find<R extends BaseNode>(
  predicate :(n :BaseNode) => R,
  options? :FindOptions,
) :Promise<R[]>

declare function find<R extends BaseNode>(
  predicate :(n :BaseNode) => boolean|undefined|void,
  options? :FindOptions,
) :Promise<R[]>


/**
 * visit traverses the tree represented by node, calling visitor for each node.
 *
 * If the visitor returns false for a node with children, that
 * node's children will not be visited. This allows efficient searching
 * where you know that you can skip certain branches.
 *
 * Note: visitor is not called for the `node` argument.
 */
declare function visit(
  node :ContainerNode|ReadonlyArray<ContainerNode>,
  visitor :NodePredicate,
) :Promise<void>;

/** Predicate function for find and visit */
type NodePredicate = (n :BaseNode) => boolean|undefined|void;

/** Options to find() */
interface FindOptions {
  includeHidden? :boolean  // include hidden layers
}
