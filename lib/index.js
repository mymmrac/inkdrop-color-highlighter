"use babel"

import { markdownRenderer } from "inkdrop"

import visit from "unist-util-visit"

const colorCodeRegexp = /#[0-9a-fA-F]{6}/g

const highlighter = options => tree => {
    visit(tree, "text", node => {
        if (!node.value.search(colorCodeRegexp)) {
            return
        }

        node.type = "html"
        node.value = node.value.replace(
            colorCodeRegexp,
            match => {
                return `<span style="color: ${match};">${match}</span>`
            },
        )
    })
}

module.exports = {

    activate() {
        if (!markdownRenderer) {
            return
        }

        markdownRenderer.remarkPlugins.push(highlighter)
        console.log("Highlighter loaded!")
    },

    deactivate() {
        if (!markdownRenderer) {
            return
        }

        const { remarkPlugins } = markdownRenderer

        const i = remarkPlugins.indexOf(highlighter)
        if (i >= 0) {
            remarkPlugins.splice(i, 1)
            console.log("Highlighter unloaded!")
        }
    }

}

