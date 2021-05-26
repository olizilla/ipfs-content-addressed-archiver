# IPFS Content Addressed Archiver ✨📦

Use your browser to hash files with IPFS and export them as a verifiable [content-addressed archive]()

Content-addressed archives store data as blocks (a sequence of bytes) each prefixed with the [Content ID (CID)](https://docs.ipfs.io/concepts/content-addressing/) derived from the hash of the data; typically in a file with a `.car` extension.

You can import .car files into an IPFS node using the command line or the HTTP API. Doing so will verify the data and provide the files, p2p style over the IPFS network. 

```shell
$ ipfs dag import <my.car>
```

**This website does not do that.** It just creates a .car file for you. If you want the full publish to IPFS from a website experience, check out https://share.ipfs.io

This website shows how you can create IPFS hashes in the browser, and export the blocks in a portable, verifiable, content-addressed archive.

## Getting started

The site is built with [Vite], [Preact], and [Tachyons]. If you've used React you'll pick it up fast.

Install the deps with `npm`

```console
$ npm install
```

Run the dev server with `npm start`

```console
$ npm start

> dweb.link@0.0.0 start
> vite


  vite v2.1.3 dev server running at:

  > Local:    http://localhost:3000/
  > Network:  http://192.168.1.110:3000/

  ready in 206ms.
```

## Homepage

![screen shot of homepage](https://user-images.githubusercontent.com/58871/119691851-d2e0d100-be42-11eb-8e41-be9a3bdeb323.png)



[vite]: https://vitejs.dev/
[preact]: https://preactjs.com/
[tachyons]: https://tachyons.io/