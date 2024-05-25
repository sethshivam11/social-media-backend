# Sociial

This is a complex social media application where users can post images, can have chats, group chats, react on chats, like/dislike posts comment on posts, follow/unfollow each other and much more. It is built using Node, Express, MongoDB, Socket.io, JWT, Bcrypt.

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

`CORS_ORIGIN`

`MAIL_USER`

`MAIL_PASSWORD`

# API Documentation

## **User**

---

### Check for username availability

    /v1/users/usernameAvailable/:username

> **_GET_**

**Request Params** ->

- Required fields
  `username`

username must contain letters, numbers, underscores('\_') and dots('.')

##### Example response

---

```JSON
{
  "statusCode": 200,
  "data": {},
  "message": "Username available",
  "success": true
}
```

### Register a new user

    /v1/users/register

> **_POST_**

**Request Body** ->

- Required fields
  `fullName` `email` `password` `username`

- Optional Fields
  `avatar` -- accepts image file

##### Example response

---

```JSON
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

### Verify user's mail

    /v1/users/verify

> **_GET_**

**Request Query** ->

- Required fields
  `code`, `username`

##### Example response

---

```JSON
{
  "statusCode": 200,
  "data": {},
  "message": "User verified",
  "success": true
}
```

### Resend mail (verification code)

    /v1/users/resendMail

> **_GET_**

**Request Query** ->

- Required fields
  `username`

##### Example response

---

```JSON
{
  "statusCode": 200,
  "data": {},
  "message": "Email sent",
  "success": true
}
```


### Login a user

    /v1/users/login

> **_POST_**

**Request Body** ->

- Required fields
  `email` `password`

- Optional Fields
  `email` `username` - either one of them

##### Example response

---

```JSON
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

### Logout a user

    /v1/users/logout

> **_GET_**

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

##### Example response

---

```JSON
{
  "statusCode": 200,
  "data": {},
  "message": "User logged out",
  "success": true
}
```

### Get current user

    /v1/users/get

> **_GET_**

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

##### Example response

---

```JSON
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

### Update avatar/profile picture

    /v1/users/updateAvatar

> **_PATCH_**

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

```JSON
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

### Remove avatar/profile picture

    /v1/users/removeAvatar

> **_GET_**

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

##### Example response

---

```JSON
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

### Update user details

    /v1/users/updateDetails

> **_PUT_**

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

```JSON
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

### Change login password

    /v1/users/changePassword

> **_PATCH_**

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

```JSON
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

### Update blue tick status

    /v1/users/updateBlue

> **_GET_**

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

##### Example response

---

```JSON
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

### Block a user

    /v1/users/block/:userId

> **_GET_**

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

```JSON
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

### Unblock a user

    /v1/users/:userId

> **_GET_**

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

```JSON
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

### Renew Access Token when accessTokens expires

    /v1/users/renewAccessToken

> **_POST_**

**Request Body** ->

- Required fields
  `refreshToken`

##### Example response

---

```JSON
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

### Follow a user

    /v1/follow/new/:followee

> **_POST_**

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Params** ->

- Required fields
  `followee`

##### Example response

---

```JSON
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

### Unfollow a user

    /v1/follow/unfollow/:unfollowee

> **_POST_**

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Params** ->

- Required fields
  `unfollowee`

##### Example response

---

```JSON
{
  "statusCode": 200,
  "data": {},
  "message": "Unfollowed user",
  "success": true
}
```

### Get all followings

    /v1/follow/getFollowers

> **_GET_**

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Query** ->

- Optional fields
  `page`

##### Example response

---

```JSON
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

### Get all followers

    /v1/follow/getFollowing

> **_GET_**

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Query** ->

- Optional fields
  `page`

##### Example response

---

```JSON
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

### New post

    /v1/posts/new

> **_POST_**

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

```JSON
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

### Get specific user's posts

    /v1/posts/user/:userId

> **_GET_**

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Params** ->

- Required fields
  `userId`

**Request Query** ->

- Optional fields
  `page`

##### Example response

---

```JSON
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
      "media": "SOME_MEDIA_LINK",
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

### Get specific post

    /v1/posts/post/:postId

> **_GET_**

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

```JSON
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

### Create feed

    /v1/posts/createFeed

> **_GET_**

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Query** ->

- Optional fields
  `page`

##### Example response

---

```JSON
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

### Like a post

    /v1/posts/like/:postId

> **_GET_**

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

```JSON
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

### Dislike a post

    /v1/posts/dislike/:postId

> **_GET_**

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

```JSON
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

### Add to tags

    /v1/posts/addTags

> **_PUT_**

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

```JSON
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

### Remove from tags

    /v1/posts/removeTags

> **_PUT_**

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

```JSON
{
  "statusCode": 200,
  "data": {},
  "message": "Users removed from tags",
  "success": true
}
```

## **Comments**

### Comment on a post

    /v1/comments/new

> **_POST_**

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Body** ->

- Required fields
  `postId` `comment`

##### Example response

---

```JSON
{
  "statusCode": 200,
  "data": {
    "user": "SOME_USER_ID",
    "post": "SOME_POST_ID",
    "content": "COMMENT_CONTENT",
    "likes": [],
    "likesCount": 0,
    "_id": "SOME_COMMENT_ID",
    "createdAt": "2024-02-26T02:15:46.590Z",
    "updatedAt": "2024-02-26T02:15:46.590Z",
    "__v": 0
  },
  "message": "Comment created successfully",
  "success": true
}
```

### Get all comments on a post

    /v1/comments/get/:postId

> **_GET_**

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Query** ->

- Optional fields
  `page`

**Request Params** ->

- Required fields
  `postId`

##### Example response

---

```JSON
{
  "statusCode": 200,
  "data": [
    {
      "_id": "SOME_COMMENT_ID",
      "user": "SOME_USER_ID",
      "post": "SOME_POST_ID",
      "content": "COMMENT_CONTENT",
      "likes": [],
      "likesCount": 0,
      "createdAt": "2024-02-26T02:15:46.590Z",
      "updatedAt": "2024-02-26T02:15:46.590Z",
      "__v": 0
    }
  ],
  "message": "Comments retrieved successfully",
  "success": true
}
```

### Like a comment

    /v1/comments/like/:postId

> **_GET_**

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

```JSON
{
  "statusCode": 200,
  "data": {
    "_id": "SOME_COMMENT_ID",
    "user": "SOME_USER_ID",
    "post": "SOME_POST_ID",
    "content": "COMMENT_CONTENT",
    "likes": [
      "SOME_OTHER_USER_ID"
    ],
    "likesCount": 1,
    "createdAt": "2024-02-26T02:15:46.590Z",
    "updatedAt": "2024-02-26T02:19:48.674Z",
    "__v": 1
  },
  "message": "Comment liked successfully",
  "success": true
}
```

### Dislike a post

    /v1/comments/dislike/:postId

> **_GET_**

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

```JSON
{
  "statusCode": 200,
  "data": {
    "_id": "SOME_COMMENT_ID",
    "user": "SOME_USER_ID",
    "post": "SOME_POST_ID",
    "content": "COMMENT_CONTENT",
    "likes": [],
    "likesCount": 0,
    "createdAt": "2024-02-26T02:15:46.590Z",
    "updatedAt": "2024-02-26T02:19:48.674Z",
    "__v": 1
  },
  "message": "Comment disliked successfully",
  "success": true
}
```

### Delete a comment

    /v1/comments/delete/:postId

> **_DELETE_**

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

```JSON
{
  "statusCode": 200,
  "data": {},
  "message": "Comment deleted successfully",
  "success": true
}
```

## **Chats**

### New one on one chat

    /v1/chats/chats/new/:recieverId

> **_POST_**

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Params** ->

- Required fields
  `recieverId`

##### Example response

---

```JSON
{
  "statusCode": 200,
  "data": {
    "users": [
      "SOME_USER_ID",
      "SOME_OTHER_USER_ID"
    ],
    "isGroupChat": false,
    "admin": [],
    "groupName": "personal",
    "groupIcon": "",
    "_id": "SOME_CHAT_ID",
    "createdAt": "2024-02-26T02:35:56.979Z",
    "updatedAt": "2024-02-26T02:35:56.979Z",
    "__v": 0
  },
  "message": "Chat created successfully",
  "success": true
}
```

### Get all chats related to a user

    /v1/chats/get

> ---

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Query** ->

- Optional fields
  `page`

##### Example response

---

```JSON
{
  "statusCode": 200,
  "data": [
     {
      "_id": "SOME_CHAT_ID",
      "users": [
        {
          "_id": "SOME_USER_ID",
          "avatar": "SOME_AVATAR_LINK",
          "username": "username123"
        },
        {
          "_id": "SOME_OTHER_USER_ID",
          "avatar": "SOME_AVATAR_LINK",
          "username": "username234"
        }
      ],
      "isGroupChat": false,
      "admin": [],
      "groupName": "personal",
      "groupIcon": "",
      "createdAt": "2024-02-26T02:35:56.979Z",
      "updatedAt": "2024-02-26T02:35:56.979Z",
      "__v": 0
    }
  ],
  "message": "Chats fetched successfully",
  "success": true
}
```

### New group chat

    /v1/chats/groupChat

> **_POST_**

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Body** ->

- Required fields
  `groupName` `participants`

- Optional fields
  `admin` `groupImage` -- file

##### Example response

---

```JSON
{
  "statusCode": 200,
  "data": {
    "users": [
      "SOME_USER_ID",
      "SOME_OTHER_USER_ID"
    ],
    "isGroupChat": true,
    "admin": [
      "SOME_USER_ID"
    ],
    "groupName": "SOME_GROUP_NAME",
    "groupIcon": "SOME_GROUP_ICON",
    "_id": "SOME_CHAT_ID",
    "createdAt": "2024-02-26T02:50:02.985Z",
    "updatedAt": "2024-02-26T02:50:02.985Z",
    "__v": 0
  },
  "message": "Group chat created successfully",
  "success": true
}
```

### Add participats to a group

    /v1/chats/addParticipants

> **_PATCH_**

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Params** ->

- Required fields
  `chatId` `participants`

##### Example response

---

```JSON
{
  "statusCode": 200,
  "data": {
    "_id": "SOME_CHAT_ID",
    "users": [
      "SOME_USER_ID",
      "SOME_OTHER_USER_ID",
      "SOME_OTHER_USER_ID",
    ],
    "isGroupChat": true,
    "admin": [
      "SOME_USER_ID",
      "SOME_OTHER_USER_ID"
    ],
    "groupName": "SOME_GROUP_NAME",
    "groupIcon": "SOME_GROUP_ICON",
    "createdAt": "2024-02-17T17:40:44.398Z",
    "updatedAt": "2024-02-26T02:56:42.220Z",
    "__v": 16
  },
  "message": "Participants added successfully",
  "success": true
}
```

### Remove participants from a group

    /v1/chats/removeParticipants

> ---

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Body** ->

- Required fields
  `chatId` `participants`

##### Example response

---

```JSON
{
  "statusCode": 200,
  "data": {},
  "message": "Participants removed successfully",
  "success": true
}
```

### Update group details

    /v1/chats/updateGroup

> **_PUT_**

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Body** ->

- Required fields
  `chatId`

- Optional fields
  `groupName` `groupImage` -- either one of them

##### Example response

---

```JSON
{
  "statusCode": 200,
  "data": {
    "_id": "SOME_CHAT_ID",
    "users": [
      "SOME_USER_ID",
      "SOME_OTHER_USER_ID",
      "SOME_OTHER_USER_ID",
    ],
    "isGroupChat": true,
    "admin": [
      "SOME_USER_ID",
      "SOME_OTHER_USER_ID"
    ],
    "groupName": "SOME_GROUP_NAME",
    "groupIcon": "SOME_GROUP_ICON",
    "createdAt": "2024-02-17T17:40:44.398Z",
    "updatedAt": "2024-02-26T02:56:42.220Z",
    "__v": 16
  },
  "message": "Participants added successfully",
  "success": true
}
```

### Remove group image

    /v1/chats/removeGroupImage/:chatId

> **_PATCH_**

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Params** ->

- Required fields
  `chatId`

##### Example response

---

```JSON
{
  "statusCode": 200,
  "data": {
    "_id": "SOME_CHAT_ID",
    "users": [
      "SOME_USER_ID",
      "SOME_OTHER_USER_ID",
      "SOME_OTHER_USER_ID",
    ],
    "isGroupChat": true,
    "admin": [
      "SOME_USER_ID",
      "SOME_OTHER_USER_ID"
    ],
    "groupName": "SOME_GROUP_NAME",
    "groupIcon": "DEFAULT_GROUP_ICON",
    "createdAt": "2024-02-17T17:40:44.398Z",
    "updatedAt": "2024-02-26T02:56:42.220Z",
    "__v": 16
  },
  "message": "Participants added successfully",
  "success": true
}
```

### Make user an admin

    /v1/chats/makeAdmin

> **_PATCH_**

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Body** ->

- Required fields
  `chatId` `userId`

##### Example response

---

```JSON
{
  "statusCode": 200,
  "data": {
    "_id": "SOME_CHAT_ID",
    "users": [
      "SOME_USER_ID",
      "SOME_OTHER_USER_ID",
      "SOME_OTHER_USER_ID",
    ],
    "isGroupChat": true,
    "admin": [
      "SOME_USER_ID",
      "SOME_OTHER_USER_ID"
    ],
    "groupName": "SOME_GROUP_NAME",
    "groupIcon": "DEFAULT_GROUP_ICON",
    "createdAt": "2024-02-17T17:40:44.398Z",
    "updatedAt": "2024-02-26T02:56:42.220Z",
    "__v": 16
  },
  "message": "Participants added successfully",
  "success": true
}
```

### Remove from admin

    /v1/chats/removeAdmin

> **_PATCH_**

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Params** ->

- Required fields
  `chatId` `userId`

##### Example response

---

```JSON
{
  "statusCode": 200,
  "data": {
    "_id": "SOME_CHAT_ID",
    "users": [
      "SOME_USER_ID",
      "SOME_OTHER_USER_ID",
      "SOME_OTHER_USER_ID",
    ],
    "isGroupChat": true,
    "admin": [
      "SOME_USER_ID",
      "SOME_OTHER_USER_ID"
    ],
    "groupName": "SOME_GROUP_NAME",
    "groupIcon": "DEFAULT_GROUP_ICON",
    "createdAt": "2024-02-17T17:40:44.398Z",
    "updatedAt": "2024-02-26T02:56:42.220Z",
    "__v": 16
  },
  "message": "Participants added successfully",
  "success": true
}
```

### Leave a group chat

    /v1/chats/leaveGroup/:chatId

> **_GET_**

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

##### Example response

---

```JSON
{
  "statusCode": 200,
  "data": {},
  "message": "Group left successfully",
  "success": true
}
```

### Delete a group chat

    /v1/chats/deleteGroup/:chatId

> **_DELETE_**

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Params** ->

- Required fields
  `chatId`

##### Example response

---

```JSON
{
  "statusCode": 200,
  "data": {},
  "message": "Group deleted successfully",
  "success": true
}
```

## **Messages**

### Send a message

    /v1/messages/send

> **_POST_**

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Body** ->

- Required fields
  `chatId` `message`

##### Example response

---

```JSON
{
  "statusCode": 201,
  "data": {
    "sender": "SOME_USER_ID",
    "chat": "SOME_CHAT_ID",
    "content": "SOME_CONTENT",
    "attachments": [],
    "reacts": [],
    "readBy": [],
    "_id": "SOME_MESSAGE_ID",
    "createdAt": "2024-02-26T14:40:00.137Z",
    "updatedAt": "2024-02-26T14:40:00.137Z",
    "__v": 0
  },
  "message": "Message sent",
  "success": true
}
```

### React a message

    /v1/messages/react

> **_PATCH_**

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Body** ->

- Required fields
  `messageId`

- Optional fields
  `content`

##### Example response

---

```JSON
{
  "statusCode": 200,
  "data": {
    "_id": "SOME_MESSAGE_ID",
    "sender": "SOME_USER_ID",
    "chat": "SOME_CHAT_ID",
    "content": "SOME_CONTENT",
    "attachments": [],
    "reacts": [
      {
        "content": "❤️",
        "user": "SOME_USER_ID"
      }
    ],
    "readBy": [],
    "createdAt": "2024-02-26T14:40:00.137Z",
    "updatedAt": "2024-02-26T15:59:26.160Z",
    "__v": 1
  },
  "message": "Message reacted",
  "success": true
}
```

### Unreact a message

    /v1/messages/unreact/:messageId

> **_PATCH_**

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Params** ->

- Required fields
  `messageId`

##### Example response

---

```JSON
{
  "statusCode": 200,
  "data": {},
  "message": "Message unreacted",
  "success": true
}
```

### Get all messages of a chat

    /v1/messages/get

> **_GET_**

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Query** ->

- Required fields
  `chatId`

- Optional fields
  `page`

##### Example response

---

```JSON
{
  "statusCode": 200,
  "data": [
    {
      "_id": "SOME_MESSAGE_ID",
      "sender": {
        "_id": "SOME_USER_ID",
        "avatar": "SOME_AVATAR",
        "username": "blaisepascal"
      },
      "chat": "SOME_CHAT_ID",
      "content": "Hi",
      "attachments": [],
      "reacts": [
        {
          "content": "❤️",
          "user": "SOME_USER_ID"
        }
      ],
      "readBy": [],
      "createdAt": "2024-02-26T14:40:00.137Z",
      "updatedAt": "2024-02-26T16:02:54.955Z",
      "__v": 1
    },
  ],
  "message": "Messages fetched",
  "success": true
}
```

### Get reactions on a message

    /v1/messages/getReactions/:messageId

> **_GET_**

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Params** ->

- Required fields
  `messageId`

**Request Query** ->

- Optional fields
  `page`

##### Example response

---

```JSON
{
  "statusCode": 200,
  "data": [
    {
      "content": "❤️",
      "user": "SOME_USER_ID"
    }
  ],
  "message": "Reactions fetched",
  "success": true
}
```

### Edit a message

    /v1/messages/editMessage

> **_PATCH_**

**Request Headers** ->

- Required fields
  `Authorization`

- Example value
  `Authorization: Bearer YOUR_BEARER_TOKEN`

**Request Body** ->

- Required fields
  `messageId` `content`

##### Example response

---

```JSON
{
  "statusCode": 200,
  "data": {
    "_id": "SOME_MESSAGE_ID",
    "sender": "SOME_USER_ID",
    "chat": "SOME_CHAT_ID",
    "content": "UPDATED_MESSAGE_CONTENT",
    "attachments": [],
    "reacts": [
      {
        "content": "❤️",
        "user": "SOME_USER_ID"
      },
    ],
    "readBy": [],
    "createdAt": "2024-02-18T11:09:41.207Z",
    "updatedAt": "2024-02-26T16:09:09.695Z",
    "__v": 2
  },
  "message": "Message edited",
  "success": true
}
```
