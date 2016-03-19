/**
 * INSPINIA - Responsive Admin Theme
 *
 */

/**
 * MainCtrl - controller
 */
function MainCtrl() {

    this.userName = 'Rishi Sharma';
    this.address = 'C-3, STC Society, Andheri East';
    this.aboutMe = 'I am a very Happy Person';
    this.image = 'https://fbcdn-sphotos-e-a.akamaihd.net/hphotos-ak-xat1/v/t1.0-9/12065645_10205311800938114_4214567713771183504_n.jpg?oh=f9aa828377684378568da5a9cf3496c0&oe=5790CFC0&__gda__=1465129730_4998a2bccd092bd8aa5d026126977987';
    this.helloText = 'Welcome in SeedProject lala';
    this.descriptionText = 'It is an application skeleton for a typical AngularJS web app. You can use it to quickly bootstrap your angular webapp projects and dev environment for these projects.';

};


angular
    .module('inspinia')
    .controller('MainCtrl', MainCtrl)