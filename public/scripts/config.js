/**  * INSPINIA - Responsive Admin Theme  *  * Inspinia theme use AngularUI
Router to manage routing and views  * Each view are defined as state.  *
Initial there are written stat for all view in theme.  *  */ function
config($stateProvider, $urlRouterProvider) {
$urlRouterProvider.otherwise("/index/main");

    $stateProvider

        .state('index', {
            abstract: true,
            url: "/index",
            templateUrl: "views/common/content.html",
        })
        .state('index.main', {
            url: "/main",
            templateUrl: "views/main.html",
            data: { pageTitle: 'Example view' }
        })
        .state('index.minor', {
            url: "/minor",
            templateUrl: "views/minor.html",
            data: { pageTitle: 'Example view' }
        })
         .state('index.video', {
            url: "/minor",
            templateUrl: "views/video.html",
            data: { pageTitle: 'Example view' }
        })
         .state('index.profile', {
            url: "/profile",
            templateUrl: "views/profile.html",
            data: { pageTitle: 'Profile' }
        })

}
angular
    .module('inspinia')
    .config(config)
    .run(function($rootScope, $state) {
        $rootScope.$state = $state;
    });