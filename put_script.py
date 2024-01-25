#!/usr/bin/env python3

# Copyright 2021 Allterco Robotics EOOD
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import sys
from argparse import ArgumentParser

import requests

parser = ArgumentParser()
parser.add_argument("host", help="IP address or hostname of the Shelly device")
parser.add_argument("file", help="Local file containing the script code to upload")

SYMBOLS_IN_CHUNK = 1024


def create_script(host, name):
    """Create a new script on the device and return its ID"""
    url = f"http://{host}/rpc/Script.Create"
    req = {"name": name}
    req_data = json.dumps(req, ensure_ascii=False)
    res = requests.post(url, data=req_data.encode("utf-8"), timeout=2)
    id = res.json()["id"]
    print(f"Created script {id}")
    return id


def put_chunk(host, id_, data, append=True):
    url = f"http://{host}/rpc/Script.PutCode"
    req = {"id": id_, "code": data, "append": append}
    req_data = json.dumps(req, ensure_ascii=False)
    res = requests.post(url, data=req_data.encode("utf-8"), timeout=2)
    print(res.json())


def start_script(host, id_):
    """Start the script on the device"""
    url = f"http://{host}/rpc/Script.Start"
    req = {"id": id_}
    req_data = json.dumps(req, ensure_ascii=False)
    res = requests.post(url, data=req_data.encode("utf-8"), timeout=2)
    print(res.json())


def main():
    args = parser.parse_args()
    script_id = create_script(args.host, args.file)

    with open(
        args.file,
        mode="r",
        encoding="utf-8",
    ) as f:
        code = f.read()

    pos = 0
    append = False
    print(f"total {len(code)} bytes")
    while pos < len(code):
        chunk = code[pos : pos + SYMBOLS_IN_CHUNK]
        put_chunk(args.host, script_id, chunk, append)
        pos += len(chunk)
        append = True

    start_script(args.host, script_id)


if __name__ == "__main__":
    main()
