module.exports = {
  my_api(request, response) {
    const data = request.query;
    console.log(data);
    response.status(200).json({ body: "good" });
  },
};
