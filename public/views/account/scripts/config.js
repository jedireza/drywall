/**  * INSPINIA - Responsive Admin Theme  *  * Inspinia theme use AngularUI
Router to manage routing and views  * Each view are defined as state.  *
Initial there are written stat for all view in theme.  *  */ function
config($stateProvider, $urlRouterProvider) {
$urlRouterProvider.otherwise("/index/main");

    $stateProvider

        .state('index', {
            abstract: true,
            url: "/index",
            templateUrl: "/views/account/common/content.html",
        })
        .state('index.main', {
            url: "/main",
            templateUrl: "/views/account/main.html",
            data: { pageTitle: 'Example view' }
        })
        .state('index.minor', {
            url: "/minor",
            templateUrl: "/views/account/minor.html",
            data: { pageTitle: 'Example view' }
        })
         .state('index.video', {
            url: "/minor",
            templateUrl: "/views/account/video.html",
            data: { pageTitle: 'Example view' }
        })
         .state('index.profile', {
            url: "/profile",
            templateUrl: "/views/account/profile.html",
            data: { pageTitle: 'Profile' }
        })

}
angular
    .module('inspinia')
    .config(config)
    .run(function($rootScope, $state) {
        $rootScope.$state = $state;
    });
