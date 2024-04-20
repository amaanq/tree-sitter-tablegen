/**
 * @file LLVM TableGen grammar for tree-sitter
 * @author Sebastian Neubauer <flakebi@t-online.de>
 * @author Amaan Qureshi <amaanq12@gmail.com>
 * @license MIT
 * @see {@link https://llvm.org/docs/TableGen|official website}
 * @see {@link https://llvm.org/docs/TableGen/ProgRef.html|official reference}
 */

/* eslint-disable arrow-parens */
/* eslint-disable camelcase */
/* eslint-disable-next-line spaced-comment */
/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: 'tablegen',

  externals: $ => [
    $.multiline_comment,
  ],

  extras: $ => [
    $.comment,
    $.multiline_comment,
    $.preprocessor_directive,
    /\s/,
  ],

  supertypes: $ => [
    $.simple_value,
    $.statement,
    $.type,
  ],

  word: $ => $.identifier,

  rules: {
    tablegen_file: $ => repeat(choice(
      $.statement,
      $.preprocessor_directive,
    )),

    include_directive: $ => seq('include', $.string),

    preprocessor_directive: _ => token(choice(
      seq(
        choice('#define', '#ifdef', '#ifndef'),
        /\s+/,
        field('macro_name', /[a-zA-Z_][a-zA-Z_0-9]*/),
      ),
      '#else',
      '#endif',
    )),

    statement: $ => choice(
      $.assert,
      $.class,
      $.def,
      $.defm,
      $.defset,
      $.defvar,
      $.foreach,
      $.if,
      $.let,
      $.multiclass,
      $.include_directive,
    ),

    block: $ => choice(
      $.statement,
      seq('{', repeat($.statement), '}'),
    ),

    class: $ => seq(
      'class',
      field('name', $.identifier),
      optional($.template_args),
      field('body', $.record_body),
    ),

    template_args: $ => seq('<', optionalCommaSep($.template_arg), '>'),

    template_arg: $ => seq(
      $.type,
      $.identifier,
      optional(seq('=', $.value)),
    ),

    record_body: $ => seq(
      optional($.parent_class_list),
      $.body,
    ),

    parent_class_list: $ => seq(
      ':',
      commaSep1(seq(
        $.identifier,
        optional(seq('<', optionalCommaSep($.value), '>')),
      )),
    ),

    body: $ => choice(
      ';',
      seq('{', repeat($.body_item), '}'),
    ),

    body_item: $ => choice(
      $.instruction,
      $.let_instruction,
      $.def_var,
      $.assert,
    ),

    instruction: $ => seq(
      optional('field'), // deprecated
      choice($.type, 'code'),
      $.identifier,
      optional(seq('=', $.value)),
      ';',
    ),

    let_instruction: $ => seq(
      'let',
      $.identifier,
      optional(seq('{', $.range_list, '}')),
      '=',
      $.value,
      ';',
    ),

    def_var: $ => seq(
      'defvar',
      field('name', $.identifier),
      '=',
      $.value,
      ';',
    ),

    def: $ => seq(
      'def',
      field('name', optional($.value)),
      $.record_body,
    ),

    let: $ => seq(
      'let',
      $.let_list,
      'in',
      choice($.statement, seq('{', repeat($.statement), '}')),
    ),

    let_list: $ => optionalCommaSep1($.let_item),

    let_item: $ => seq(
      $.identifier,
      optional(seq('<', $.range_list, '>')),
      '=',
      $.value,
    ),

    multiclass: $ => seq(
      'multiclass',
      field('name', $.identifier),
      optional($.template_args),
      optional($.parent_class_list),
      $.multiclass_body,
    ),

    multiclass_body: $ => choice(
      ';',
      seq('{', repeat1($.multiclass_statement), '}'),
    ),

    multiclass_statement: $ => choice(
      $.assert,
      $.def,
      $.defm,
      $.defvar,
      $.foreach,
      $.if,
      $.let,
    ),

    defm: $ => seq(
      'defm',
      field('name', optional($.value)),
      optional($.parent_class_list),
      ';',
    ),

    defset: $ => seq(
      'defset',
      $.type,
      field('name', $.identifier),
      '=',
      '{',
      repeat($.statement),
      '}',
    ),

    defvar: $ => seq('defvar', $.identifier, '=', $.value, ';'),

    foreach: $ => seq('foreach', $.foreach_iterator, 'in', $.block),

    foreach_iterator: $ => seq(
      $.identifier,
      '=',
      choice(
        seq('{', $.range_list, '}'),
        $.range_piece,
        $.value,
      ),
    ),

    if: $ => prec.left(seq(
      'if',
      $.value,
      'then',
      $.block,
      optional(seq('else', $.block)),
    )),

    assert: $ => seq('assert', $.value, ',', $.value, ';'),

    type: $ => choice(
      $.primitive_type,
      $.bits_type,
      $.list_type,
      alias($.identifier, $.class_identifier),
    ),

    primitive_type: _ => choice('bit', 'int', 'string', 'dag'),

    bits_type: $ => seq('bits', '<', $.integer, '>'),

    list_type: $ => seq('list', '<', $.type, '>'),

    value: $ => prec.left(choice(
      seq($.simple_value, repeat($.value_suffix)),
      $.paste_value,
    )),

    paste_value: $ => prec.right(seq($.value, '#', optional($.value))),

    value_suffix: $ => choice(
      seq('{', $.range_list, '}'),
      seq('[', $.range_list, ']'),
      seq('.', $.identifier),
    ),

    value_list: $ => optionalCommaSep1($.value),

    range_list: $ => commaSep1($.range_piece),

    range_piece: $ => prec(1, choice(
      seq($.value, '...', $.value),
      seq($.value, '-', $.value),
      $.value,
    )),

    simple_value: $ => prec.right(choice(
      $.integer,
      $.string,
      $.concatenated_string,
      $.code,
      $.boolean,
      alias('?', $.uninitialized_value),
      $.sequence,
      $.list_initializer,
      $.dag_initializer,
      $.identifier,
      $.anonymous_record,
      $.operator,
    )),

    sequence: $ => seq('{', $.value_list, '}'),

    list_initializer: $ => seq(
      '[',
      optional($.value_list),
      ']',
      optional(seq('<', $.type, '>')),
    ),

    dag_initializer: $ => seq(
      '(',
      $.dag_arg,
      optional($.dag_arg_list),
      ')',
    ),

    dag_arg_list: $ => optionalOptionalCommaSep1($.dag_arg),

    dag_arg: $ => choice(
      seq($.value, optional(seq(':', $.var))),
      $.var,
    ),

    anonymous_record: $ => seq($.identifier, '<', commaSep($.value), '>'),

    concatenated_string: $ => prec.right(
      seq($.string, repeat1($.string)),
    ),

    operator: $ => choice(
      seq(
        $.bang_operator,
        optional(seq('<', $.type, '>')),
        '(',
        $.value_list,
        ')',
      ),
      seq($.cond_operator, '(', optionalCommaSep($.cond_clause), ')'),
    ),

    cond_clause: $ => seq($.value, ':', $.value),

    bang_operator: _ => seq(
      '!',
      choice(
        'add',
        'and',
        'cast',
        'con',
        'dag',
        'div',
        'empty',
        'eq',
        'exists',
        'filter',
        'find',
        'foldl',
        'foreach',
        'ge',
        'getop',
        'getdagop',
        'gt',
        'head',
        'if',
        'interleave',
        'isa',
        'le',
        'listconcat',
        'listremove',
        'listsplat',
        'logtwo',
        'lt',
        'mul',
        'ne',
        'not',
        'or',
        'setop',
        'setdagop',
        'shl',
        'size',
        'sra',
        'srl',
        'strconcat',
        'sub',
        'subst',
        'substr',
        'tail',
        'tolower',
        'toupper',
        'xor',
      ),
    ),

    cond_operator: _ => seq('!', 'cond'),

    integer: _ => {
      const decimal = /[+-]?\d+/;
      const hex = /0x[\da-fA-F]+/;
      const bin = /0b[01]+/;
      return token(choice(decimal, hex, bin));
    },

    string: $ => seq(
      '"',
      repeat(choice(
        $.string_content,
        $._escape_sequence,
      )),
      '"',
    ),

    // Workaround to https://github.com/tree-sitter/tree-sitter/issues/1156
    // We give names to the token_ constructs containing a regexp
    // so as to obtain a node in the CST.
    //
    string_content: _ => token.immediate(prec(1, /[^"\\]+/)),

    _escape_sequence: $ => choice(
      prec(2, token.immediate(seq('\\', /[^abfnrtvxu'\"\\\?]/))),
      prec(1, $.escape_sequence),
    ),

    escape_sequence: _ => token.immediate(seq(
      '\\',
      choice(
        /[^xu0-7]/,
        /[0-7]{1,3}/,
        /x[0-9a-fA-F]{2}/,
        /u[0-9a-fA-F]{4}/,
        /u\{[0-9a-fA-F]+\}/,
        /U[0-9a-fA-F]{8}/,
      ))),

    // FIXME: Use a scanner for this
    code: _ => /\[\{([^}]|\}+[^}\]])*\}\]/,

    code_content: _ => token.immediate(prec(1, /[^\\}]+/)),

    _code_escape_sequence: $ => choice(
      prec(2, token.immediate(seq('\\', /[^tn'\"\\]/))),
      prec(1, $.code_escape_sequence),
    ),

    code_escape_sequence: _ => token.immediate(seq(
      '\\',
      /[tn'\"\\]/,
    )),

    boolean: _ => choice('true', 'false'),

    identifier: _ => /[0-9]*[a-zA-Z_][a-zA-Z0-9_]*/,

    var: _ => /\$[a-zA-Z_][a-zA-Z0-9_]*/,

    comment: _ => /\/\/[^\n\r]*/,
  },
});

/**
 * Creates a rule to match zero or more of the rules separated by a comma
 * optionally followed by a comma.
 *
 * @param {Rule} rule
 *
 * @return {SeqRule}
 *
 */
function optionalCommaSep(rule) {
  return seq(commaSep(rule), optional(','));
}

/**
 * Creates a rule to match one or more of the rules separated by a comma
 * optionally followed by a comma.
 *
 * @param {Rule} rule
 *
 * @return {SeqRule}
 *
 */
function optionalCommaSep1(rule) {
  return seq(commaSep1(rule), optional(','));
}

/**
 * Creates a rule to match zero or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @return {ChoiceRule}
 */
function commaSep(rule) {
  return optional(commaSep1(rule));
}

/**
 * Creates a rule to match one or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @return {SeqRule}
 *
 */
function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

/**
 * Creates a rule to match one or more of the rules optionally separated by a comma
 * optionally followed by a comma.
 *
 * @param {Rule} rule
 *
 * @return {SeqRule}
 *
 */
function optionalOptionalCommaSep1(rule) {
  return seq(rule, repeat(seq(optional(','), rule)), optional(','));
}
