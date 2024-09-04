# BackEnd-test

You must have Postman to use the (//name:
//description:
//price:
//catagories:
//brand:
//stock:
//image:) following commands they can be used in bulk edit in form.

npm run dev
to start the server

#GET Methode:

#Product:

localhost:3000/api/products
to get all products

localhost:3000/api/products/66d5fde3a55458b5bb454d17
localhost:3000/api/products/id
to get specific product

#User:

localhost:3000/api/users
to get all users

localhost:3000/api/users/66d8688622c8d9e42026d86f
localhost:3000/api/users/id
to get specific user

#POST Methode:

#Product

localhost:3000/api/createproducts

//name:
//description:
//price:
//catagories:
//brand:
//stock:
//image:

to add a product

#User:
localhost:3000/api/createusers

//firstName:
//lastName:
//email:
//userName:rezatahseem
//password:

to add a user

#PUT Methode:

#Product:

localhost:3000/api/updateproducts/66d5fde3a55458b5bb454d17

//name:
//description:
//price:
//catagories:
//brand:
//stock:

to update a product

localhost:3000/api/updateproducts/image/66d5fde3a55458b5bb454d17


//image:


to update produts image

#User:

localhost:3000/api/updateusers/66d8688622c8d9e42026d86f

//firstName
//lastName
//email
//userName
//password

to update a user

#DELETE Methode

#Product:

localhost:3000/api/data/id

to delete a product

#User:

localhost:3000/api/deleteusers/id

to delete a user


