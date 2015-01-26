angular.module('scheduleApp',['firebase','ngRoute']).config(function($routeProvider,USER_ROLES) {

$routeProvider.when("/login", {
    templateUrl: "login.html",
    controller: "loginController"
    });

    $routeProvider.when("/planer", {
    templateUrl: "planer.html",
    controller: "mainController",
    data: {
          authorizedRoles: [USER_ROLES.admin, USER_ROLES.editor],
          user: {id:"",role:""},
          id: ""
        }
    });

    $routeProvider.otherwise( {
    redirectTo: "/login"
    });

})

.controller('mainController', function($scope,$firebase) {

var ref = new Firebase("https://boiling-fire-1609.firebaseio.com/days");
var fb = $firebase(ref);

var syncObject = fb.$asObject();

syncObject.$bindTo($scope, 'days');

$scope.reset = function() {
fb.$set({
monday: {
name: 'Monday',
slots: {
0900: {time: '9:00am', booked: false },
0110: {time: '11:00am', booked: false},
0120: {time: '12:00am', booked: false}

        }
       },
tuesday: {
        name: 'Tuesday',
        slots: {
          0900: {time: '9:00am',booked: false},
          0110: {time: '11:00am',booked: false}
        }
      },
      wednesday: {
              name: 'Wednesday',
              slots: {
                0900: {time: '9:00am',booked: false},
                0110: {time: '11:00am',booked: false}
              }
            }

       });

};
})

.controller('loginController',function($scope, $rootScope, $firebase, AUTH_EVENTS, AuthService) {

var ref = new Firebase("https://boiling-fire-1609.firebaseio.com/users");
var fb = $firebase(ref);

var syncObject = fb.$asObject();
syncObject.$bindTo($scope, 'users');

$scope.credentials = {
username: '',
password: ''
};

$scope.login = function (credentials) {

AuthService.login(credentials).then( function (user){
alert("login sukces!");
$rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
$scope.setCurrentUser(user);
}, function(){
$rootScope.$broadcast(AUTH_EVENTS.loginFailed);
});
};

})

.constant('AUTH_EVENTS', {
  loginSuccess: 'auth-login-success',
  loginFailed: 'auth-login-failed',
  logoutSuccess: 'auth-logout-success',
  sessionTimeout: 'auth-session-timeout',
  notAuthenticated: 'auth-not-authenticated',
  notAuthorized: 'auth-not-authorized'
})

.constant('USER_ROLES', {
  all: '*',
  admin: 'admin',
  editor: 'editor',
  guest: 'guest'
})

.factory('AuthService', function($http,Session){
var authService = {};

authService.login = function(credentials) {
if (credentials.username == credentials.password) {
return $http
.post('#/login',credentials)
.success(function(res){
alert(res);
Session.create(res.data.id,res.data.user.id,res.data.user.role);
return res.data.user;
});
} else {
alert("bad");
return $http
.post('#/login',credentials)


};
};

authService.isAuthenticated = function() {
return !!Session.userId;
};

authService.isAuthorized = function (authorizedRoles) {
    if (!angular.isArray(authorizedRoles)) {
      authorizedRoles = [authorizedRoles];
    }
    return (authService.isAuthenticated() &&
      authorizedRoles.indexOf(Session.userRole) !== -1);
  };

return authService;
})

.service('Session',function(){

this.create = function(sessionId,userId,userRole) {
this.id = sessionId;
this.userId = userId;
this.role = userRole;
};

this.destroy = function(){
this.id = null;
this.userId = null;
this.role = null;
};

return this;

})

.controller('applicationController',function($scope,USER_ROLES,AuthService,$route, $routeParams, $location){

 $scope.$route = $route;
     $scope.$location = $location;
     $scope.$routeParams = $routeParams;

     $scope.name = 'applicationController';
     $scope.params = $routeParams;

$scope.currentUser = null;
  $scope.userRoles = USER_ROLES;
  $scope.isAuthorized = AuthService.isAuthorized;

  $scope.setCurrentUser = function (user) {
    alert(user.value);
    $scope.currentUser = user;
  };

})

.run(function ($rootScope, $location, AUTH_EVENTS, AuthService) {
     $rootScope.$on('$routeChangeStart', function (event,next,current) {
       var authorizedRoles = next.data.authorizedRoles;
       if (!AuthService.isAuthorized(authorizedRoles)) {
         event.preventDefault();
         if (AuthService.isAuthenticated()) {
           // user is not allowed
           $rootScope.$broadcast(AUTH_EVENTS.notAuthorized);
         } else {
           // user is not logged in
           $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
         }
       }
     });
   });
