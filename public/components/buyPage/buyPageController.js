(function () {

function buyPageController (
  $scope,
  $location,
  $window,
  $localStorage,
  ModalService,
  shoppingCartService,
  config,
  apiService
) {

  $scope.baseApi = config.baseApi
  $scope.items = shoppingCartService.get()

  $scope.price = 'Total: R$ ' + ($scope.items.length * 30);

  console.log($scope.items);

  function subscription (shoppingCart) {
    $scope.items = shoppingCart
  }

  shoppingCartService.subscribe(subscription)

  $scope.removeAll = function () {
    shoppingCartService.removeAll()
    $location.path('/')
  }

  $scope.removeItem = function (picture) {
    shoppingCartService.remove(picture)
    $scope.price = 'Total: R$ ' + ($scope.items.length * 30);
  }

  $scope.buy = function () {
    var isLogged = !!$localStorage.chave

    if (isLogged) {
      console.log($scope.items);
      console.log($localStorage.chave);
      apiService.buy({
        foto_chaves: $scope.items,
        empresa_chave: $localStorage.chave
      }).then(function (response) {
        shoppingCartService.removeAll()
        console.log(response)
        $.notify({
          title: '<strong>Compras: </strong>',
          message: 'Compras efetuadas com sucesso!'
        },{
          type: 'success'
        });
        $location.path('minhas-compras')
      }, function (error) {
        console.error('error')
        console.error(error)
        shoppingCartService.removeAll()
        $.notify({
          title: '<strong>Compras: </strong>',
          message: 'Compras efetuadas com sucesso!'
        },{
          type: 'success'
        });
        $location.path('minhas-compras')
      })
    } else {
      $location.path('login')
    }
  }

  $scope.showPicture = function (index, picture) {
    console.log('showing picture')
    console.log(picture)

    ModalService.showModal({
      templateUrl: "components/pictureModal/pictureModalTemplate.html",
      controller: "pictureModalController",
      inputs: {
        picture: picture,
        index: index,
        baseApi: config.baseApi
      }
    }).then(function(modal) {
      modal.element.modal();
      modal.close.then(function(result) {

      });
    })
  }
}

angular.module("pixewsWeb").controller('buyPageController', buyPageController)

})()