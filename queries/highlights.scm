; Preprocs

(preprocessor_directive) @preproc

; Includes

"include" @include

; Keywords

[
  "assert"
  "class"
  "multiclass"
  "field"
  "let"
  "def"
  "defm"
  "defset"
  "defvar"
] @keyword

[
  "in"
] @keyword.operator

; Conditionals

[
  "if"
  "else"
  "then"
] @conditional

; Repeats

[
  "foreach"
] @repeat

; Variables

(identifier) @variable

(var) @variable.builtin ; need something more suitable, but nothing fits

; Parameters

(template_arg (identifier) @parameter)


; Types

(type) @type

[
  "bit"
  "int"
  "string"
  "dag"
  "bits"
  "list"
  "code"
] @type.builtin

(class name: (identifier) @type)

(multiclass (identifier) @type)

(def name: (value (_) @type))

(defm name: (value (_) @type))

(parent_class_list (identifier) @type (value (_) @type)?)

(anonymous_record (identifier) @type)

(anonymous_record (value (_) @type))

((identifier) @type
  (#lua-match? @type "^_*[A-Z][A-Z0-9_]+$"))

; Fields

(instruction
  (identifier) @field)

(let_instruction
  (identifier) @field)

; Functions

[
  (bang_operator)
  (cond_operator)
] @function

; Operators

[
  "="
  "#"
  "-"
  ":"
  "..."
] @operator

; Literals

(string) @string

(code) @string.special

(integer) @number

(boolean) @boolean

(uninitialized_value) @constant.builtin

; Punctuation

[ "{" "}" ] @punctuation.bracket

[ "[" "]" ] @punctuation.bracket

[ "(" ")" ] @punctuation.bracket

[ "<" ">" ] @punctuation.bracket

[
  "."
  ","
  ";"
] @punctuation.delimiter

[
 "!"
] @punctuation.special

; Comments

[
  (comment)
  (multiline_comment)
] @comment @spell

; Errors

(ERROR) @error
