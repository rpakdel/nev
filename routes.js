
function index(req, res) 
{
  res.render('index.jade');
}

function supersized(req, res)
{
  res.render('supersized.jade');
}

function photoswipe(req, res)
{
  res.render('photoswipe.jade');
}

function single(req, res)
{
  res.render('single.jade');
}

exports.index = index;
exports.supersized = supersized; 
exports.photoswipe = photoswipe;
exports.single = single;