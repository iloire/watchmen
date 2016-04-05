# make sure you:
# export DIGITALOCEAN_TOKEN=<youtoken>
# export SSH_FINGERPRINT=<your-ssh-key-fingerprint>
terraform destroy \
  -var "do_token=${DIGITALOCEAN_TOKEN}" \
  -var "ssh_fingerprint=$SSH_FINGERPRINT"
