class ApiResponse {
  constructor(statusCode, data, message = "success") {
    this.message = message;
    this.data = data;
    this.success = statusCode < 400;
    this.statusCode = statusCode;
  }
}
