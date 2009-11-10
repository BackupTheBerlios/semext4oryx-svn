/**
 * @class   Ext.ux.tree.TreeFilterX
 * @extends Ext.tree.TreeFilter
 *
 * 


 * Shows also parents of matching nodes as opposed to default TreeFilter. In other words
 * this filter works "deep way".
 *

 *
 * @author   Ing. Jozef SakÃ¡loÅ¡
 * @version  1.0
 * @date     17. December 2008
 * @revision $Id: Ext.ux.tree.TreeFilterX.js 589 2009-02-21 23:30:18Z jozo $
 * @see      http://extjs.com/forum/showthread.php?p=252709
 *
 * @license Ext.ux.tree.CheckTreePanel is licensed under the terms of
 * the Open Source LGPL 3.0 license.  Commercial use is permitted to the extent
 * that the code/component(s) do NOT become part of another Open Source or Commercially
 * licensed development library or toolkit without explicit permission.
 * 
 * 

License details: http://www.gnu.org/licenses/lgpl.html

 *
 * @forum     55489
 * @demo      http://remotetree.extjs.eu
 *
 * @donate
 * 

 *
 *
 *
 *
 *

 */

Ext.ns('Ext.ux.tree');

/**
 * Creates new TreeFilterX
 * @constructor
 * @param {Ext.tree.TreePanel} tree The tree panel to attach this filter to
 * @param {Object} config A config object of this filter
 */
Ext.ux.tree.TreeFilterX = Ext.extend(Ext.tree.TreeFilter, {
        
/**
         * @cfg {Boolean} expandOnFilter Deeply expands startNode before filtering (defaults to true)
         */
         expandOnFilter:true

        // {{{
    
/**
     * Filter the data by a specific attribute.
         *
     * @param {String/RegExp} value Either string that the attribute value 
     * should start with or a RegExp to test against the attribute
     * @param {String} attr (optional) The attribute passed in your node's attributes collection. Defaults to "text".
     * @param {TreeNode} startNode (optional) The node to start the filter at.
     */
        ,filter:function(value, attr, startNode) {

                // expand start node
                if(false !== this.expandOnFilter) {
                        startNode = startNode || this.tree.root;
                        var animate = this.tree.animate;
                        this.tree.animate = false;
                        startNode.expand(true, false, function() {

                                // call parent after expand
                                Ext.ux.tree.TreeFilterX.superclass.filter.call(this, value, attr, startNode);

                        }.createDelegate(this));
                        this.tree.animate = animate;
                }
                else {
                        // call parent
                        Ext.ux.tree.TreeFilterX.superclass.filter.apply(this, arguments);
                }

        } // eo function filter
        // }}}
        // {{{
    
/**
     * Filter by a function. The passed function will be called with each 
     * node in the tree (or from the startNode). If the function returns true, the node is kept 
     * otherwise it is filtered. If a node is filtered, its children are also filtered.
         * Shows parents of matching nodes.
         *
     * @param {Function} fn The filter function
     * @param {Object} scope (optional) The scope of the function (defaults to the current node) 
     */
        ,filterBy:function(fn, scope, startNode) {
                startNode = startNode || this.tree.root;
                if(this.autoClear) {
                        this.clear();
                }
                var af = this.filtered, rv = this.reverse;

                var f = function(n) {
                        if(n === startNode) {
                                return true;
                        }
                        if(af[n.id]) {
                                return false;
                        }
                        var m = fn.call(scope || n, n);
                        if(!m || rv) {
                                af[n.id] = n;
                                n.ui.hide();
                                return true;
                        }
                        else {
                                n.ui.show();
                                var p = n.parentNode;
                                while(p && p !== this.root) {
                                        p.ui.show();
                                        p = p.parentNode;
                                }
                                return true;
                        }
                        return true;
                };
                startNode.cascade(f);

        if(this.remove){
           for(var id in af) {
               if(typeof id != "function") {
                   var n = af[id];
                   if(n && n.parentNode) {
                       n.parentNode.removeChild(n);
                   }
               }
           } 
        }
        } // eo function filterBy
        // }}}

}); // eo extend

// eof

