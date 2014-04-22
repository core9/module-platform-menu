angular.module('core9Dashboard.menueditor.app', [
  'ui.router',
  'ui.bootstrap',
  'ui.sortable',
  'core9Dashboard.config',
  'core9Dashboard.menu',
  ])

.config(function($stateProvider) {
  $stateProvider
  .state('menueditor',  {
    url: '/config/menueditor',
    views: {
      "main": {
        controller: 'MenuEditorCtrl',
        templateUrl: 'menu-editor/menulist.tpl.html'
      }
    },
    data:{ 
      pageTitle: 'Menu',
      sidebar: 'config'
    }
  })
  .state('menueditormenu',  {
    url: '/config/menueditor/:id',
    views: {
      "main": {
        controller: 'MenuEditorMenuCtrl',
        templateUrl: 'menu-editor/menu.tpl.html'
      }
    },
    data:{ 
      pageTitle: 'Menu',
      sidebar: 'config'
    }
  });
})

.factory('MenuEntryTypes', function() {
  var menuEntryTypes = {};

  this.getMenuEntryTypes = function() {
    return menuEntryTypes;
  };

  this.getMenuEntryTypeTemplate = function(id) {
    return menuEntryTypes[id].templateUrl;
  };

  this.getMenuEntryConfigTemplate = function(id) {
    return menuEntryTypes[id].configUrl;
  };

  this.registerMenuEntryType = function(type) {
    menuEntryTypes[type.id] = type;
    return this;
  };

  return this;
})

.directive('cnMenuItem', function($compile, $templateCache, MenuEntryTypes) {
  return {
    replace: true,
    scope: {
      item: '=cnItem',
      parent: '=cnParent',
      state: '=cnState',
      clazz: '@cnClass'
    },
    link: function(scope, element, attrs) {
      scope.$watch('item.type', function() {
        if(scope.item.type !== undefined) {
          var e = $compile($templateCache.get(MenuEntryTypes.getMenuEntryTypeTemplate(scope.item.type)))(scope);
          element.replaceWith(e);
        }
      });

      scope.edit = function() {
        scope.state.parent = scope.parent;
        scope.state.showConfig = false;
        scope.state.showConfig = true;
        scope.state.editItem = scope.item;
      };

      scope.sortableOptions = {
        connectWith: "ul"
      };
    }
  };
})

.directive('cnMenuItemConfig', function($compile, $templateCache, MenuEntryTypes) {
  return {
    replace: false,
    scope: {
      menu: '=cnMenu',
      state: '=cnState'
    },
    link: function(scope, element, attrs) {
      scope.menuEntryTypes = MenuEntryTypes.getMenuEntryTypes();
      scope.$watch('state.editItem.type', function() {
        if(scope.state.editItem.type !== undefined) {
          scope.newItem = {type: MenuEntryTypes.getMenuEntryTypes()[scope.state.editItem.type].childs[0]};
          var itemConfig = $templateCache.get(MenuEntryTypes.getMenuEntryConfigTemplate(scope.state.editItem.type));
          var actions = $templateCache.get("menueditor/entryactions.tpl.html");
          var e = $compile((itemConfig + actions))(scope);
          element.html(e);
        }
      });

      scope.addItem = function() {
        if(scope.state.editItem.items === undefined) {
          scope.state.editItem.items = [];
        }
        scope.state.editItem.items.push(scope.newItem);
        scope.newItem = {type: scope.newItem.type};
        scope.refreshMenu();
      };

      scope.remove = function() {
        var index = scope.state.parent.items.indexOf(scope.state.editItem);
        scope.state.parent.items.splice(index, 1);
        console.log(scope.state.parent.items);
        scope.state.parent = null;
        scope.state.editItem = null;
        scope.state.showConfig = false;
        scope.refreshMenu();
      };

      scope.refreshMenu = function() {
        scope.state.fresh = false;
        scope.state.fresh = true;
      };
    }
  };
})

.controller('MenuEditorCtrl', function($scope, $state, ConfigFactory) {
  $scope.menus = ConfigFactory.query({configtype: 'menu'});

  $scope.add = function(newName) {
    var menu = new ConfigFactory({configtype: 'menu'});
    menu.name = newName;
    menu.type = 'nav';
    menu.$save(function(data) {
      $scope.menus.push(data);
      $state.go("menueditormenu", {id: data._id});
    });
  };

  $scope.edit = function(menu) {
    $state.go("menueditormenu", {id: menu._id});
  };


  $scope.remove = function(menu) {
    menu.$remove(function(data) {
      $scope.menus = ConfigFactory.query({configtype: 'menu'});
    });
  };
})

.controller('MenuEditorMenuCtrl', function($scope, $stateParams, ConfigFactory, MenuEntryTypes) {
  $scope.state = {fresh: true};
  $scope.menu = ConfigFactory.get({configtype: 'menu', id: $stateParams.id});

  $scope.save = function() {
    $scope.menu.$update();
  };

  

  $scope.remove = function() {
    var index = $scope.state.parent.items.indexOf($scope.state.editItem);
    console.log(index);
    if(index > -1) {
      $scope.state.parent.items.splice(index, 1);
    }
  };
})

.run(function(MenuService, MenuEntryTypes) {
  MenuEntryTypes
  .registerMenuEntryType({id: 'nav', name: 'Menu', templateUrl: 'menu-editor/entrytypes/nav.tpl.html', configUrl: 'menu-editor/entrytypes/ul.config.tpl.html', childs: ['navitem', 'li']})
  .registerMenuEntryType({id: 'navitem', name: 'Top level entry', templateUrl: 'menu-editor/entrytypes/navitem.tpl.html', configUrl: 'menu-editor/entrytypes/li.config.tpl.html', childs: ['ul', 'text']})
  .registerMenuEntryType({id: 'li', name: 'List Item', templateUrl: 'menu-editor/entrytypes/li.tpl.html', configUrl: 'menu-editor/entrytypes/li.config.tpl.html', childs: ['ul', 'text']})
  .registerMenuEntryType({id: 'ul', name: 'List', templateUrl: 'menu-editor/entrytypes/ul.tpl.html', configUrl: 'menu-editor/entrytypes/ul.config.tpl.html', childs: ['li']})
  .registerMenuEntryType({id: 'text', name: 'Text', templateUrl: 'menu-editor/entrytypes/text.tpl.html', configUrl: 'menu-editor/entrytypes/text.config.tpl.html', childs: []});
  MenuService.add('config', {title: "Menu", weight: 150, link: "menueditor"});
})
;
