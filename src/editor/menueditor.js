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
          var actions = $templateCache.get("menu-editor/entryactions.tpl.html");
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

.controller("MenuEditorGeneratorCtrl", function($scope, ConfigFactory, ContentFactory) {
  $scope.contenttypes = ConfigFactory.query({configtype: 'content'});

  $scope.$watch('contenttype', function() {
    if($scope.contenttype !== undefined) {
      $scope.fields = $scope.getContentRefFields($scope.contenttype.schemaOptions);
    }
  });
  
  $scope.getContentRefFields = function(schemaOptions) {
    if(schemaOptions !== undefined) {
      var result = [];
      var items, i;
      for(var field in schemaOptions) {
        if(field === 'widget' && schemaOptions[field] === 'contentref') {
          result.push({name: 'this', field: schemaOptions});
        } else if(typeof(schemaOptions[field]) === 'object') {
          items = $scope.getContentRefFields(schemaOptions[field]);
          for(i = 0; i < items.length; i++) {
            if(items[i].name === 'this') {
              if(field === 'items') {
                items[i].field['qty'] = 'multiple';
              } else {
                items[i].name = field;
              }
            } else {
              items[i].name = field + "." + items[i].name;
            }
            result.push(items[i]);
          }
        }
      }
      return result;
    }
  };

  $scope.generate = function() {
    ContentFactory.query({contenttype: $scope.contenttype.name}, function (data) {
      var items = {};
      for (var i = data.length - 1; i >= 0; i--) {
        items[data[i]._id] = data[i];
      }
      for (i = data.length - 1; i >= 0; i--) {
        if(data[i][$scope.field.name] !== undefined && data[i][$scope.field.name].length > 0) {
          handleChildren(data[i], $scope.field.name, items);
        }
      }
      $scope.$parent.menu.items = [];
      for (var key in items) {
        if(items[key][$scope.field.name] !== undefined && items[key][$scope.field.name].length > 0) {
          var children = getChildMenuItems(items[key], $scope.field.name, $scope.titlefield, $scope.link);
          $scope.$parent.menu.items.push({type: 'navitem', name: items[key][$scope.titlefield], items: [children]});
        } else {
          $scope.$parent.menu.items.push({type: 'navitem', name: items[key][$scope.titlefield], link: getLink($scope.link, items[key])});
        }
      }
      console.log($scope.$parent.menu);
    });
  };

  function getLink(link, item) {
    var groups = link.match(/:([A-Za-z0-9\-_]+)/g);
    for (var d = groups.length - 1; d >= 0; d--) {
      console.log(groups[d]);
      link = link.replace(groups[d], item[groups[d].substring(1)]);
    }
    return link;
  }

  function getChildMenuItems(item, fieldname, titlefield, link) {
    var result = {};
    result.name = item[titlefield];
    if(item[fieldname] !== undefined && item[fieldname].length > 0) {
      result.items = [];
      for (var i = item[fieldname].length - 1; i >= 0; i--) {
        result.items.push(getChildMenuItems(item[fieldname][i].full, fieldname, titlefield, link));
      }
    }
    if(result.items !== undefined) {
      result.type = 'ul';
    } else {
      result.type = 'li';
      result.link = getLink(link, item);
    }
    return result;
  }

  function handleChildren(item, field, items) {
    if(item[field] === undefined) {
      return;
    }
    for (var i = item[field].length - 1; i >= 0; i--) {
      if(items[item[field][i].value] === undefined) {
        alert("Item '" + item[field][i].key + "' is already used or doesn't exist.");
      } else if(items[item[field][i].value][field] !== undefined && items[item[field][i].value][field].length > 0) {
        // Check if sub level has items, recursively walk through them
        handleChildren(items[item[field][i].value][field], field, items);
      }
      item[field][i].full = items[item[field][i].value];
      items[item._id] = item;
      delete items[item[field][i].value];
    }
  }
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
