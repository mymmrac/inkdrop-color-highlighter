"use babel"

import { actions, markdownRenderer } from "inkdrop"

import visit from "unist-util-visit"

const pkg = "color-highlighter"

const toggleCmd = `${pkg}:toggle`

const enabledCfg = `${pkg}.enabled`

const colorCodeRegexp = /#[0-9a-fA-F]{6}/g

const highlighter = options => tree => {

    if (!inkdrop.config.get(enabledCfg)) {
        return
    }


    visit(tree, "text", node => {
        if (node.value.search(colorCodeRegexp) < 0) {
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

    config: {
        enabled: {
            title: "Enabled",
            description: "Quick toggle of color highlighter",
            type: "boolean",
            default: true
        }
    },

    activate() {
        if (!markdownRenderer) {
            return
        }

        inkdrop.commands.add(document.body, toggleCmd, e => {
            let enabled = inkdrop.config.get(enabledCfg)
            inkdrop.config.set(enabledCfg, !enabled)
        })

        inkdrop.config.observe(enabledCfg, isEnabled => {
            inkdrop.store.dispatch(actions.editingNote.update({}))
        })

        markdownRenderer.remarkPlugins.push(highlighter)
    },

    deactivate() {
        if (!markdownRenderer) {
            return
        }

        const { remarkPlugins } = markdownRenderer

        const i = remarkPlugins.indexOf(highlighter)
        if (i >= 0) {
            remarkPlugins.splice(i, 1)
        }

        inkdrop.store.dispatch(actions.editingNote.update({}))
    }

}

