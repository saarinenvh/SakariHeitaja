const kaatis = {
  {name: "Aki Laaksonen", rating: "898"},
  {name: "Antti Räisänen", rating: "824"},
  {name: "Jenni Grönvall", rating: "805"},
  {name: "Jon Grönvall", rating: "836"},
  {name: "Karo Kreander", rating: "0"},
  {name: "Klaus Väisälä", rating: "863"},
  {name: "Lauri Saarinen", rating: "873"},
  {name: "Nestori Vainio", rating: "0"},
  {name: "Valtteri Varmola", rating: "872"},
  {name: "Ville Saarinen", rating: "924"},
  {name: "Wilhelm Takala", rating: "800"}
}

const competitions = [kaatis]
const games = [1047644, 1047645]
const points = [100,90,83,75,70,65,60,55,53,50,48,45,43,40,38,35,33,30,28,25,23,20]

countHandicaps() {
  for (competition in competitions) {
      for (player in competition) {
        console.log(player)
      }
  }

}
