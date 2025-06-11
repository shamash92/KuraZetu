# How to customize Multipass for Kurazetu

```bash
multipass stop kurazetu-vm
multipass set local.kurazetu-vm.cpus=4
multipass set local.kurazetu-vm.disk=60G
multipass set local.kurazetu-vm.memory=7G
```

```bash
multipass start kurazetu-vm
multipass info kurazetu-vm
```
