angular.module( 'core9Dashboard.menueditor', [
  'core9Dashboard.menueditor.app',
  'templates-module-platform-menu'
  ])

;

angular.module('core9Dashboard.admin.dashboard').requires.push('core9Dashboard.menueditor');