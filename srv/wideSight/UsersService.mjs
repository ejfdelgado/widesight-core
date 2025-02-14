'use strict';

export class UsersService {
  static async getUser(req, res, next) {
    const email = req.params['email'];
    const response = await UsersServiceImplementation.getUser(email);
    res.status(200).send(response);
  }
}

export class UsersServiceImplementation {
  /**
   * Get user
   * Get user by email 
   *
   * email String User email
   * returns GetUserResponse
   **/
  static async getUser(email) {
    return {
      "user": {
        "email": email,
        "name": "string"
      },
      "acounts": [
        {
          "id": "string",
          "name": "string",
          "apps": [
            {
              "id": "string",
              "name": "string"
            }
          ]
        }
      ]
    }

  }
}