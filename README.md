# Sociial

A social media project built on MERN Stack (MongoDB, ExpressJS, ReactJS, NodeJS) is a powerful application which provides users to connect through realtime chats



### Run Locally

Clone the project

```
  git clone https://github.com/sethshivam11/sociial.git
```

Go to the project directory

```
  cd sociial
```

Install dependencies

```
  npm run build
```

Start the server

```
  npm run start
```


## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`MONGODB_URI`

`PORT`

`CLOUDINARY_CLOUD_NAME`

`CLOUDINARY_API_KEY`

`CLOUDINARY_API_SECRET`

`ACCESS_TOKEN_SECRET`

`ACCESS_TOKEN_EXPIRY`

`REFRESH_TOKEN_SECRET`

`REFRESH_TOKEN_EXPIRY`

`NODE_ENV`

# API Documentation

## Introduction 

This is simple social media application where users can post images, can have chats, group chats, react on chats, like/dislike posts comment on posts, follow/unfollow each other.

 ## **User**

---
###     Register a new user

    /v1/users/register

> ***POST***

**Request Body**  ->

- Required fields 
    `fullName` `email` `password` `username`

 - Optional Fields
    `avatar` -- accepts image file

##### Example response
---
```
{
  "statusCode": 200,
  "data": {
    "avatar": "SOME_AVATAR_LINK",
    "fullName": "Full Name",
    "username": "username123",
    "email": "example@mail.com",
    "followingCount": 0,
    "followersCount": 0,
    "postsCount": 0,
    "isBlueTick": false,
    "isMailVerified": false,
    "blocked": [],
    "_id": "SOME_ID",
    "createdAt": "2024-02-18T11:46:00.402Z",
    "updatedAt": "2024-02-18T11:46:00.402Z",
    "__v": 0
  },
  "message": "User registered successfully",
  "success": true
}
```


###     Login a user

    /v1/users/login

> ***POST***

**Request Body**  ->

- Required fields
    `email` `password`

- Optional Fields
    `email` `username` -- either one of them

##### Example response
---
```
{
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "SOME_ID",
      "avatar": "SOME_AVATAR_LINK",
      "fullName": "Full Name",
      "username": "username123",
      "email": "example@mail.com",
      "followingCount": 0,
      "followersCount": 0,
      "postsCount": 0,
      "isBlueTick": false,
      "isMailVerified": false,
      "blocked": [],
      "createdAt": "2024-02-18T11:46:00.402Z",
      "updatedAt": "2024-02-18T11:46:00.402Z",
      "__v": 0
    },
    "accessToken": "SOME_ACESS_TOKEN",
    "refreshToken": "SOME_REFRESH_TOKEN"
  },
  "message": "User logged in successfully",
  "success": true
}
```

###     Check for username availability

    /v1/users/usernameAvailable/:username

> ***GET***

**Request Params** ->

- Required fields
    `username` 

##### Example response
---
```
{
  "statusCode": 200,
  "data": {},
  "message": "Username available",
  "success": true
}
```


###     Logout a user

    /v1/users/logout

> ***POST***

**Request Headers** ->

- Required fields
    `Authorization`

- Example value
    `Authorization: Bearer YOUR_BEARER_TOKEN`

##### Example response
---
```
{
  "statusCode": 200,
  "data": {},
  "message": "User logged out",
  "success": true
}
```


###     Get current user

    /v1/users/get

> ***GET***

**Request Headers** ->

- Required fields
    `Authorization`

- Example value
    `Authorization: Bearer YOUR_BEARER_TOKEN`

##### Example response
---
```
{
  "statusCode": 200,
  "data": {
    "_id": "SOME_ID",
    "avatar": "SOME_AVATAR_LINK",
    "fullName": "Full Name",
    "username": "username123",
    "email": "example@mail.com",
    "followingCount": 0,
    "followersCount": 0,
    "postsCount": 0,
    "isBlueTick": false,
    "isMailVerified": false,
    "blocked": [],
    "createdAt": "2024-02-18T11:46:00.402Z",
    "updatedAt": "2024-02-18T12:08:15.327Z",
    "__v": 0
  },
  "message": "User found",
  "success": true
}
```


###     Verify user's mail

    /v1/users/verifyMail

> ***GET***

**Request Headers** ->

- Required fields
    `Authorization`

- Example value
    `Authorization: Bearer YOUR_BEARER_TOKEN`

##### Example response
---
```
{
  "statusCode": 200,
  "data": {
    "_id": "SOME_ID",
    "avatar": "SOME_AVATAR_LINK",
    "fullName": "Full Name",
    "username": "username123",
    "email": "example@mail.com",
    "followingCount": 0,
    "followersCount": 0,
    "postsCount": 0,
    "isBlueTick": false,
    "isMailVerified": true,
    "blocked": [],
    "createdAt": "2024-02-18T11:46:00.402Z",
    "updatedAt": "2024-02-18T12:18:15.034Z",
    "__v": 0
  },
  "message": "User verified",
  "success": true
}
```


###     Update avatar/profile picture

    /v1/users/updateAvatar

> ***PATCH***

**Request Headers** ->

- Required fields
    `Authorization`

- Example value
    `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Body** ->

- Required fields
    `avatar`

##### Example response
---
```
{
  "statusCode": 200,
  "data": {
    "_id": "SOME_ID",
    "avatar": "UPDATED_AVATAR_LINK",
    "fullName": "Full Name",
    "username": "username123",
    "email": "example@mail.com",
    "followingCount": 0,
    "followersCount": 0,
    "postsCount": 0,
    "isBlueTick": false,
    "isMailVerified": true,
    "blocked": [],
    "createdAt": "2024-02-18T11:46:00.402Z",
    "updatedAt": "2024-02-18T12:23:02.872Z",
    "__v": 0
  },
  "message": "Avatar updated",
  "success": true
}
```


###     Remove avatar/profile picture

    /v1/users/removeAvatar

> ***GET***

**Request Headers** ->

- Required fields
    `Authorization` 

- Example value
    `Authorization: Bearer YOUR_BEARER_TOKEN`

##### Example response
---
```
{
  "statusCode": 200,
  "data": {
   "_id": "SOME_ID",
    "avatar": "DEFAULT_AVATAR_LINK",
    "fullName": "Full Name",
    "username": "username123",
    "email": "example@mail.com",
    "followingCount": 0,
    "followersCount": 0,
    "postsCount": 0,
    "isBlueTick": false,
    "isMailVerified": true,
    "blocked": [],
    "createdAt": "2024-02-18T11:46:00.402Z",
    "updatedAt": "2024-02-18T12:26:46.236Z",
    "__v": 0
  },
  "message": "Avatar removed",
  "success": true
}
```


###     Update user details

    /v1/users/updateDetails

> ***PUT***

**Request Headers** ->

- Required fields
    `Authorization` 

- Example value
    `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Body** ->

- Required fields
    `fullName` `email` `username` `bio` -- Anyone of these are required

##### Example response
---
```
{
  "statusCode": 200,
  "data": {
    "_id": "SOME_ID",
    "avatar": "DEFAULT_AVATAR_LINK",
    "fullName": "Full Name",
    "username": "username123",
    "email": "example@mail.com",
    "followingCount": 0,
    "followersCount": 0,
    "postsCount": 0,
    "isBlueTick": false,
    "isMailVerified": true,
    "blocked": [],
    "createdAt": "2024-02-18T11:46:00.402Z",
    "updatedAt": "2024-02-18T12:35:03.926Z",
    "__v": 0,
        "bio": "SOME_BIO"
  },
  "message": "User details updated",
  "success": true
}
```


###     Change login password

    /v1/users/changePassword

> ***PATCH***

**Request Headers** ->

- Required fields
    `Authorization` 

- Example value
    `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Body** ->

- Required fields
    `oldPassword` `newPassword`

##### Example response
---
```
{
  "statusCode": 200,
  "data": {
    "_id": "SOME_ID",
    "avatar": "DEFAULT_AVATAR_LINK",
    "fullName": "Full Name",
    "username": "username123",
    "email": "example@mail.com",
    "followingCount": 0,
    "followersCount": 0,
    "postsCount": 0,
    "isBlueTick": false,
    "isMailVerified": true,
    "blocked": [],
    "createdAt": "2024-02-18T11:46:00.402Z",
    "updatedAt": "2024-02-18T12:46:24.936Z",
    "__v": 0,
  },
  "message": "Password was changed",
  "success": true
}
```


###     Update blue tick status

    /v1/users/updateBlue

> ***GET***

**Request Headers** ->

- Required fields
    `Authorization` 

- Example value
    `Authorization: Bearer YOUR_BEARER_TOKEN`

##### Example response
---
```
{
  "statusCode": 200,
  "data": {
    "_id": "SOME_ID",
    "avatar": "DEFAULT_AVATAR_LINK",
    "fullName": "Full Name",
    "username": "username123",
    "email": "example@mail.com",
    "followingCount": 0,
    "followersCount": 0,
    "postsCount": 0,
    "isBlueTick": true,
    "isMailVerified": true,
    "blocked": [],
    "createdAt": "2024-02-18T11:46:00.402Z",
    "updatedAt": "2024-02-18T12:51:09.427Z",
    "__v": 0,
  },
  "message": "User's blue tick updated",
  "success": true
}
```


###     Block a user

    /v1/users/block/:userId

> ***GET***

**Request Headers** ->

- Required fields
    `Authorization` 

- Example value
    `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Params** ->

- Required fields
    `USER_ID` -- userId of user to be blocked 


##### Example response
---
```
{
  "statusCode": 200,
  "data": {
    "_id": "SOME_ID",
    "avatar": "DEFAULT_AVATAR_LINK",
    "fullName": "Full Name",
    "username": "username123",
    "email": "example@mail.com",
    "followingCount": 0,
    "followersCount": 0,
    "postsCount": 0,
    "isBlueTick": true,
    "isMailVerified": true,
    "blocked": [
      "ANOTHER_USER_ID"
    ],
    "createdAt": "2024-02-18T11:46:00.402Z",
    "updatedAt": "2024-02-18T12:54:13.674Z",
    "__v": 1,
  },
  "message": "User was blocked",
  "success": true
}
```


###     Unblock a user

    /v1/users/:userId

> ***GET***

**Request Headers** ->

- Required fields
    `Authorization` 

- Example value
    `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Params** ->

- Required fields
    `USER_ID` -- userId of user to be blocked 

##### Example response
---
```
{
  "statusCode": 200,
  "data": {
    "_id": "SOME_ID",
    "avatar": "DEFAULT_AVATAR_LINK",
    "fullName": "Full Name",
    "username": "username123",
    "email": "example@mail.com",
    "followingCount": 0,
    "followersCount": 0,
    "postsCount": 0,
    "isBlueTick": true,
    "isMailVerified": true,
    "blocked": [],
    "createdAt": "2024-02-18T11:46:00.402Z",
    "updatedAt": "2024-02-18T12:54:13.674Z",
    "__v": 1,
  },
  "message": "User was unblocked",
  "success": true
}
```


###     Renew Access Token when accessTokens expires

    /v1/users/renewAccessToken

> ***POST***

**Request Body** ->

- Required fields
    `refreshToken`

##### Example response
---
```
{
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "SOME_ID",
      "avatar": "DEFAULT_AVATAR_LINK",
      "fullName": "Full Name",
      "username": "username123",
      "email": "example@mail.com",
      "followingCount": 0,
      "followersCount": 0,
      "postsCount": 0,
      "isBlueTick": true,
      "isMailVerified": true,
      "blocked": [],
      "createdAt": "2024-02-18T11:46:00.402Z",
      "updatedAt": "2024-02-18T12:59:28.622Z",
      "__v": 1,
      "bio": ""
    },
    "accessToken": "NEW_ACCESS_TOKEN"
  },
  "message": "Access token was renewed",
  "success": true
}
```


 ## **Follow**


###     Follow a user

    /v1/follow/new

> ***POST***

**Request Headers** ->

- Required fields
    `Authorization` 

- Example value
    `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Body** ->

- Required fields
    `followee` 

##### Example response
---
```
{
  "statusCode": 200,
  "data": {
    "user": "SOME_USER_ID",
    "followers": [],
    "followings": [
      "SOME_OTHER_USER_ID"
    ],
    "_id": "SOME_FOLLOW_ID",
    "createdAt": "2024-02-18T13:14:52.147Z",
    "updatedAt": "2024-02-18T13:14:52.147Z",
    "__v": 0
  },
  "message": "Followed user",
  "success": true
}
```


###     Unfollow a user

    /v1/follow/unfollow

> ***POST***

**Request Headers** ->

- Required fields
    `Authorization` 

- Example value
    `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Body** ->

- Required fields
    `unfollowee` 

##### Example response
---
```
{
  "statusCode": 200,
  "data": {},
  "message": "Unfollowed user",
  "success": true
}
```


###     Get all followings

    /v1/follow/getFollowers

> ***GET***

**Request Headers** ->

- Required fields
    `Authorization` 

- Example value
    `Authorization: Bearer YOUR_BEARER_TOKEN`

##### Example response
---
```
{
  "statusCode": 200,
  "data": [
    {
      "_id": "SOME_FOLLOW_ID",
      "avatar": "SOME_AVATAR_LINK",
      "fullName": "Full Name",
      "username": "username123"
    }
  ],
  "message": "Followings found",
  "success": true
}
```


###     Get all followers

    /v1/follow/getFollowing

> ***GET***

**Request Headers** ->

- Required fields
    `Authorization` 

- Example value
    `Authorization: Bearer YOUR_BEARER_TOKEN`

##### Example response
---
```
{
  "statusCode": 200,
  "data": [
    {
      "_id": "SOME_FOLLOW_ID",
      "avatar": "SOME_FOLLOW_ID",
      "fullName": "Full Name",
      "username": "username123"
    }
  ],
  "message": "Followers found",
  "success": true
}
```

 ## **Posts**


###     New post

    /v1/posts/new

> ***POST***

**Request Headers** ->

- Required fields
    `Authorization` 

- Example value
    `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Body** ->

- Required fields
    `media`

- Optional fields
    `caption`

##### Example response
---
```
{
  "statusCode": 200,
  "data": {
    "user": "SOME_USER_ID",
    "media": "SOME_MEDIA_LINK",
    "tags": [],
    "likesCount": 0,
    "commentsCount": 0,
    "_id": "SOME_POST_ID",
    "createdAt": "2024-02-18T14:15:40.957Z",
    "updatedAt": "2024-02-18T14:15:40.957Z",
    "__v": 0
  },
  "message": "Post created successfully",
  "success": true
}
```


###     Get specific user's posts

    /v1/posts/user/:userId

> ***GET***

**Request Headers** ->

- Required fields
    `Authorization` 

- Example value
    `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Params** ->

- Required fields
    `userId` 

##### Example response
---
```
{
  "statusCode": 200,
  "data": [
    {
      "likesCount": 0,
      "_id": "SOME_POST_ID",
      "user": {
        "_id": "SOME_USER_ID",
        "avatar": "DEFAULT_AVATAR_LINK",
        "username": "username123",
        "fullName": "Full Name",
        "followingCount": 0,
        "followersCount": 0,
        "isBlueTick": true,
        "postsCount": 1
      },
      "media": "SOME_MEDIA_LINK",
      "tags": [],
      "reactsCount": 0,
      "commentsCount": 0,
      "createdAt": "2024-02-17T06:12:01.914Z",
      "updatedAt": "2024-02-17T08:30:15.051Z",
      "__v": 0
    },
    {
      "likesCount": 0,
      "_id": "SOME_POST_ID",
      "user": "SOME_USER_ID",
      "media": "SOME_MEDIA_LINKg",
      "tags": [],
      "reactsCount": 0,
      "commentsCount": 0,
      "createdAt": "2024-02-17T06:10:42.316Z",
      "updatedAt": "2024-02-17T06:10:42.316Z",
      "__v": 0
    }
  ],
  "message": "Posts retrieved successfully",
  "success": true
}
```


###     Get specific post

    /v1/posts/post/:postId

> ***GET***

**Request Headers** ->

- Required fields
    `Authorization` 

- Example value
    `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Params** ->

- Required fields
    `postId` 

##### Example response
---
```
{
  "statusCode": 200,
  "data": {
    "likesCount": 0,
    "_id": "SOME_POST_ID",
    "user": {
      "_id": "SOME_USER_ID",
        "avatar": "DEFAULT_AVATAR_LINK",
        "username": "username123",
        "fullName": "Full Name",
      "followingCount": 0,
      "followersCount": 0,
      "postsCount": 1
    },
    "media": "SOME_MEDIA_LINK",
    "tags": [],
    "reactsCount": 0,
    "commentsCount": 0,
    "createdAt": "2024-02-17T06:12:01.914Z",
    "updatedAt": "2024-02-17T08:30:15.051Z",
    "__v": 0
  },
  "message": "Post retrieved successfully",
  "success": true
}
```


###     Create feed

    /v1/posts/createFeed

> ***GET***

**Request Headers** ->

- Required fields
    `Authorization` 

- Example value
    `Authorization: Bearer YOUR_BEARER_TOKEN`

##### Example response
---
```
{
  "statusCode": 200,
  "data": [
    {
      "_id": "SOME_POST_ID",
      "user": {
        "_id": "SOME_USER_ID",
        "avatar": "SOME_AVATAR_LINK",
        "username": "username123",
        "fullName": "Full Name",
      },
      "media": "SOME_MEDIA_LINK",
      "tags": [],
      "commentsCount": 0,
      "createdAt": "2024-02-17T06:10:42.316Z",
      "updatedAt": "2024-02-17T06:10:42.316Z",
      "__v": 0,
      "likesCount": 0
    },
  ],
  "message": "Posts retrieved successfully",
  "success": true
}
```


###     Like a post

    /v1/posts/like/:postId

> ***GET***

**Request Headers** ->

- Required fields
    `Authorization` 

- Example value
    `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Params** ->

- Required fields
    `postId` 

##### Example response
---
```
{
  "statusCode": 200,
  "data": {
    "_id": "SOME_POST_ID",
    "user": "SOME_USER_ID",
    "media": "SOME_MEDIA_LINK",
    "tags": [],
    "commentsCount": 0,
    "createdAt": "2024-02-17T06:10:42.316Z",
    "updatedAt": "2024-02-17T06:10:42.316Z",
    "__v": 0,
    "likesCount": 1
  },
  "message": "Post liked successfully",
  "success": true
}
```


###     Dislike a post

    /v1/posts/dislike/:postId

> ***GET***

**Request Headers** ->

- Required fields
    `Authorization` 

- Example value
    `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Params** ->

- Required fields
    `postId` 

##### Example response
---
```
{
  "statusCode": 200,
  "data": {
    "_id": "SOME_POST_ID",
    "user": "SOME_USER_ID",
    "media": "SOME_MEDIA_LINK",
    "tags": [],
    "commentsCount": 0,
    "createdAt": "2024-02-17T06:10:42.316Z",
    "updatedAt": "2024-02-17T06:10:42.316Z",
    "__v": 0,
    "likesCount": 0
  },
  "message": "Post disliked successfully",
  "success": true
}
```


###     Add to tags

    /v1/posts/addTags

> ***PUT***

**Request Headers** ->

- Required fields
    `Authorization` 

- Example value
    `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Body** ->

- Required fields
    `postId` `tags`

##### Example response
---
```
{
  "statusCode": 200,
  "data": {
    "_id": "SOME_POST_ID",
    "user": "SOME_USER_ID",
    "caption": "SOME_CAPTION",
    "media": "SOME_MEDIA_LINK",
    "tags": [
      "ANOTHER_USER_ID"
    ],
    "likesCount": 0,
    "commentsCount": 0,
    "createdAt": "2024-02-22T15:07:58.339Z",
    "updatedAt": "2024-02-25T17:50:39.526Z",
    "__v": 2
  },
  "message": "Users added to tags",
  "success": true
}
```

###     Remove from tags

    /v1/posts/removeTags

> ***PUT***

**Request Headers** ->

- Required fields
    `Authorization` 

- Example value
    `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Body** ->

- Required fields
    `postId` `tags`

##### Example response
---
```
{
  "statusCode": 200,
  "data": {},
  "message": "Users removed from tags",
  "success": true
}
```

