import { useState, useEffect } from 'preact/hooks'
import { CarWriter } from '@ipld/car/writer'
import { importer } from 'ipfs-unixfs-importer'
import browserReadableStreamToIt from 'browser-readablestream-to-it'

export function App(props) {
  const [files, setFiles] = useState([])
  const [rootCid, setRootCid] = useState()
  return (
    <div>
      <header class="db">
        <h1 class="dib pa3 ma0 lh-tight">
          <a class="link db f4 fw7 near-black" href=".">IPFS <span class="blue fw5">CAR</span></a>
          <span class="db f6 fw6 silver">
            <span class="blue">C</span>ontent-Addressed <span class="blue">Ar</span>chive
          </span>
        </h1>
      </header>
      <section class="tc">
        <p class="ma0 pv3 ph2 mw7 center f4 fw6 lh-copy dark-gray">
          Use your browser to hash files with <a href="https://ipfs.io" class="link black fw7">IPFS</a> and export them as a verifiable 
          <a class="blue link underline-hover ml1" href="https://github.com/ipld/specs/blob/master/block-layer/content-addressable-archives.md">
            <span class="nowrap">content-addressed</span> archive
          </a>
        </p>
        <p class="dn db-ns mw6 center pv4 f5 f4-ns black bg-near-white br2 lh-copy">
          add files 📄 <Arrow /> <span class="dn di-ns">✨ </span><span class="fw7">IPFS</span> ✨ <Arrow /> download <span title="IPFS Content-Addressed Archive">.car 📦</span>
        </p>
        <div class="mw6 center mt4">
          <FileForm files={files} setFiles={setFiles} />
          { files.length ? (
            <ul class="tl bg-near-white ma0 ph0 pv2" style="list-item-style:none"> 
            {files.map(f => 
              <li class="db pv1 ph3 fw4 f6 truncate nowrap black">
                <span>{f.name}</span>
              </li>
            )}
          </ul>
          ) : null }
        </div>
        {files && files.length ? (
          <div>
            <div class="mw6 center tl bg-light-gray black pt2 pb3 ph3 fw4 f7 overflow-y-scroll">
              <label class="db">
                <a class="ttu blue fw6 link" herf="https://docs.ipfs.io/concepts/content-addressing/">IPFS <abbr title="Content ID aka the IPFS HASH">CID</abbr></a>
              </label>
              <code >{rootCid ? rootCid.toString() : '...'}</code>
            </div>
            <CarDownloadLink files={files} rootCid={rootCid} setRootCid={setRootCid} className="db mt4 pa3 mw5 center white link bg-blue f5 fw6 br1">
              Download .car file
            </CarDownloadLink>
          </div>
        ) : null}
        <p class="tc pt2 ph3 mw6 center f6 fw4 lh-copy dark-gray">
          <strong class="gold">⚠</strong> You must import your car file to an IPFS node to be able to retrieve the contents from a gateway or other peers.
        </p>
      </section>
      <section class="bg-near-white mw7 center ph3 ph4-ns pv3 mt5 lh-tight br2">
        <h2 class="f4 fw5 near-black mb1 mt3">
          🏡 It's all <strong>local</strong>
        </h2>
        <p class="gray db f5 fw5 mt0">
          No data leaves your browser. Nothing is tracked.
        </p>
        <h2 class="f4 fw5 near-black mb1 mt4">
          <span class="blue">⬢</span> It's all <strong>IPFS</strong>
        </h2>
        <p class="gray db f5 fw5 mt0">
        Just enough code to chunk & hash your files to produce an IPFS compatible content-addressed archive.
        </p>
      </section>
      <footer class="tc mw7 center mt5 mb3">
        <label class="db ttu f7 silver">Source code</label>
        <a class="link blue f6 fw5" href="https://github.com/olizilla/ipfs-content-addressed-archiver">
          github.com/olizilla/ipfs-content-addressed-archiver
        </a>
      </footer>
    </div>
  )
}

const Arrow = () => <span class="silver fw5">→</span>

function CarDownloadLink ({files, className, children, setRootCid, rootCid}) {
  const [carUrl, setCarUrl] = useState()
  useEffect(async () => {
    if (!files || files.length === 0) return
    const {root, car} = await createCarBlob(files)
    if (car) {
      setCarUrl(URL.createObjectURL(car))
      setRootCid(root)
    }
  }, [files])
  return carUrl ? <a class={className} href={carUrl} download={`${rootCid}.car`}>{children}</a> : null
}

function FileForm ({files = [], setFiles}) {
  return (
    <form style={{opacity: files.length ? 0.8 : 1}}>
      <label class="db mh2 mh0-ns pv3 link pointer glow o-90 bg-blue white relative br1">
        <span class="fw6 f5">
          {files.length ? "Pick some other files 📄" : "Open file picker 📄" }
        </span>
        <input class="dn" type="file" multiple onChange={onFileInput.bind(null, setFiles)}/>
      </label>
    </form>
  )
}

function onFileInput (setFiles, evt) {
  evt.preventDefault()
  evt.stopPropagation()
  const fileList = evt && evt.target && evt.target.files
  const files = []
  for (const file of fileList) {
    files.push(file)
  }
  console.log('adding', files)
  setFiles(files)
}

async function createCarBlob (files) {
  if (!files || !files.length) return
  if (files.car) return
  const carParts = []
  const { root, out } = await fileListToCarIterator(files)
  for await (const chunk of out) {
    carParts.push(chunk)
  }
  const car = new Blob(carParts, {
    type: 'application/car',
  })
  return { root, car }
}

class MapBlockStore {
  constructor () {
    this.store = new Map()  
  }
  * blocks () {
    for (const [cid, bytes] of this.store.entries()) {
      yield {cid, bytes}
    }
  }
  put ({ cid, bytes }) {
    return Promise.resolve(this.store.set(cid, bytes))
  }
  get (cid) {
    return Promise.resolve(this.store.get(cid))
  }
}

export async function fileListToCarIterator (fileList, blockApi = new MapBlockStore())  {
  const fileEntries = []
  for (const file of fileList) {
    fileEntries.push({
      path: file.name,
      content: browserReadableStreamToIt(file.stream())
    })
  }
  
  const options = {
    cidVersion: 1,
    wrapWithDirectory: true
  }
  const unixFsEntries = []
  for await (const entry of importer(fileEntries, blockApi, options)) {
    unixFsEntries.push(entry)
  }
  
  const root = unixFsEntries[unixFsEntries.length - 1].cid
  const { writer, out } = CarWriter.create(root)
  for (const block of blockApi.blocks()) {
    writer.put(block)
  }
  writer.close()
  console.log(root.toString())
  return { root, out }
}
