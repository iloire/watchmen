resource "digitalocean_droplet" "watchmen" {
    image = "ubuntu-14-04-x64"
    name = "watchen-droplet"
    region = "nyc2"
    size = "512mb"
    user_data = "${file("user-data.yml")}"
    ssh_keys = [
      "${var.ssh_fingerprint}"
    ]
}
