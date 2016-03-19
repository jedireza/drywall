# metisMenu [![NPM version](https://badge.fury.io/js/metismenu.svg)](http://badge.fury.io/js/metismenu) [![Bower version](https://badge.fury.io/bo/metisMenu.svg)](http://badge.fury.io/bo/metisMenu) [![PHP version](https://badge.fury.io/ph/onokumus%2Fmetismenu.svg)](http://badge.fury.io/ph/onokumus%2Fmetismenu) [![Build Status](https://secure.travis-ci.org/onokumus/metisMenu.svg?branch=master)](https://travis-ci.org/onokumus/metisMenu)

> A jQuery menu plugin


## Installation

* [npm](http://npmjs.org/)

```bash
npm install metismenu
```

* [Bower](http://bower.io)

```bash
bower install metisMenu
```

* [composer](https://getcomposer.org/)

```bash
composer require onokumus/metismenu:dev-master
```

* [Download](https://github.com/onokumus/metisMenu/archive/master.zip)

## Usage

1. Include metisMenu StyleSheet

    ```html
    <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/metisMenu/2.0.2/metisMenu.min.css">
    ```

2. Include jQuery

    ```html
    <script src="//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>
    ```

3. Include metisMenu plugin's code

    ```html
    <script src="//cdnjs.cloudflare.com/ajax/libs/metisMenu/2.0.2/metisMenu.min.js"></script>
    ```
4. Add class `metismenu` to unordered list

    ```html
    <ul class="metismenu" id="menu">

    </ul>
    ```

5. Call the plugin:

    ```javascript
    $("#menu").metisMenu();
    ```

### Options

#### toggle
Type: `Boolean`
Default: `true`

For auto collapse support.

```javascript
  $("#menu").metisMenu({
    toggle: false
  });
```

#### activeClass
Type: `String`
Default: `active`


```javascript
  $("#menu").metisMenu({
    activeClass: 'active'
  });
```

#### collapseClass
Type: `String`
Default: `collapse`


```javascript
  $("#menu").metisMenu({
    collapseClass: 'collapse'
  });
```

#### collapseInClass
Type: `String`
Default: `in`


```javascript
  $("#menu").metisMenu({
    collapseInClass: 'in'
  });
```


#### collapsingClass
Type: `String`
Default: `collapsing`


```javascript
  $("#menu").metisMenu({
    collapsingClass: 'collapsing'
  });
```

#### doubleTapToGo
Type: `Boolean`
Default: `false`

For double tap support.

```javascript
  $("#menu").metisMenu({
    doubleTapToGo: true
  });
```

### Testing
```bash
npm install
grunt serve
```

### [DEMO](http://demo.onokumus.com/metisMenu/)

Contains a simple HTML file to demonstrate metisMenu plugin.

### Release History
**DATE**       **VERSION**   **CHANGES**
* 2015-07-25   v2.0.3        When the active item has doubleTapToGo should not collapse
* 2015-05-23   v2.0.2        [fixed](https://github.com/onokumus/metisMenu/issues/34#issuecomment-104656754)
* 2015-05-22   v2.0.1        changeable classname support
* 2015-04-03   v2.0.0        Remove Bootstrap dependency
* 2015-03-24   v1.1.3        composer support
* 2014-11-01   v1.1.3        Bootstrap 3.3.0
* 2014-07-07   v1.1.0	       Add double tap functionality
* 2014-06-24   v1.0.3	       cdnjs support & rename plugin
* 2014-06-18   v1.0.3        Create grunt task
* 2014-06-10   v1.0.2        Fixed for IE8 & IE9


## Author

metisMenu was made with love by these guys and a bunch of awesome [contributors](https://github.com/onokumus/metisMenu/graphs/contributors).

[![Osman Nuri Okumuş](https://0.gravatar.com/avatar/4fa374411129d6f574c33e4753ec402e?s=70)](http://onokumus.com) |
--- | --- | --- | --- | --- | --- | ---
[Osman Nuri Okumuş](http://onokumus.com) |


## License

[MIT License](https://github.com/onokumus/metisMenu/blob/master/LICENSE)
